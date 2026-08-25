# jobs-pgboss module

Durable background jobs built on [pg-boss](https://github.com/timgit/pg-boss):
persisted queues in PostgreSQL with retries, dead-letter queues, singleton
policies, and cluster-safe cron scheduling. No queue infrastructure beyond the
Postgres you already run.

This module ships dormant: nothing in `apps/` imports it. Its tests run the
real queue lifecycle against in-process PGlite (a first-class pg-boss
backend), so `bun run check` needs no database server.

## When not to use this

Bun covers the simpler cases natively — reach for those first:

- **Scheduled work on a single instance**: `Bun.cron` runs cron-expression
  callbacks in-process, or registers OS-level cron jobs.
- **CPU-bound offload**: `Worker` gives you threads.

This module is for what those cannot do: jobs that must survive restarts,
retry with backoff, run exactly once across multiple instances, or fire on a
schedule once per cluster rather than once per replica.

## What it provides

- `defineJob({ name, schema, handler, queue })` — a typed job: Zod-validated
  payloads (on send and again on receipt — persisted JSON is untrusted),
  plus queue policy (retryLimit, retryBackoff, deadLetter, singleton).
- `createJobs(connectionString)` — the runtime: `start(jobs)` connects and
  creates queues, `send(job, payload)` enqueues, `schedule(job, cron, data)`
  manages cluster-safe cron, `work(jobs)` starts workers, `stop()` shuts
  down. The raw `boss` instance is exposed for everything else.

## Where workers run

Both sides are function calls against the same Postgres:

- **In the API (default)**: call `start` and `work` during server startup.
  Multiple API replicas work jobs safely; each job is delivered to one worker.
- **Separate worker app (graduation)**: when jobs get heavy enough to compete
  with request latency, create `apps/worker` with a small entry that calls
  `start` and `work`, and stop calling `work` in the API. Two runtimes
  sharing feature logic is the extraction trigger for `packages/core`
  described in the root `AGENTS.md`.

## Wiring it up

1. `cd apps/api && bun add @repo/jobs-pgboss@workspace:*`
2. Declare `DATABASE_URL` in `apps/api/src/env.ts` (shared with db-drizzle if
   both are adopted; the modules stay independent).
3. Define jobs beside the features that own them, and start the runtime in
   the composition root:

   ```ts
   // apps/api/src/features/welcome/jobs.ts
   import { defineJob } from '@repo/jobs-pgboss'
   import { z } from 'zod'

   export const sendWelcomeEmail = defineJob({
     name: 'send-welcome-email',
     schema: z.object({ email: z.email() }),
     queue: { retryLimit: 3, retryBackoff: true },
     handler: async ({ email }) => {
       // ...
     },
   })
   ```

   ```ts
   // apps/api/src/server.ts (composition root)
   import { createJobs } from '@repo/jobs-pgboss'

   const jobs = createJobs(env.DATABASE_URL)
   await jobs.start([sendWelcomeEmail])
   await jobs.work([sendWelcomeEmail])
   ```

4. Enqueue from features: `await jobs.send(sendWelcomeEmail, { email })`.

With db-drizzle also adopted, enqueue after the transaction commits and rely
on idempotent handlers. pg-boss ships a `fromDrizzle` adapter for enqueuing
inside a Drizzle transaction, but it does not work with the bun-sql driver
that db-drizzle uses: Bun.SQL serializes array parameters as Postgres arrays
rather than JSON, which breaks pg-boss's job insert (upstream:
[oven-sh/bun#28819](https://github.com/oven-sh/bun/issues/28819), tracked in
[timgit/pg-boss#880](https://github.com/timgit/pg-boss/issues/880)).
Transactional enqueue requires a Drizzle connection on the node-postgres or
postgres-js driver. Neither module requires the other.

## Removing it

```sh
rm -rf modules/jobs-pgboss && bun install
```

## Notes

- Schedules are evaluated about every 30 seconds; use 5-field cron
  expressions (minute precision). At least one started instance must be
  running for schedules to fire.
- pg-boss creates and migrates its own schema (`pgboss`) on `start()`,
  separate from any drizzle-managed tables.
- Handlers must be idempotent: retries and duplicate delivery are assumed,
  per the persistence rules in the root `AGENTS.md`.
