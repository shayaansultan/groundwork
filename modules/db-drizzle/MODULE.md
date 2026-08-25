# db-drizzle module

PostgreSQL access built on [Drizzle ORM](https://orm.drizzle.team/) and Bun's
native `Bun.SQL` Postgres client — no external database driver dependency.

This module ships dormant: nothing in `apps/` imports it. Its tests exercise
the Drizzle query layer against in-process [PGlite](https://pglite.dev/), so
`bun run check` needs no database server.

## What it provides

- `createDb(databaseUrl)` — a Drizzle client on `drizzle-orm/bun-sql`.
  Connects lazily on the first query.
- `Database` — the inferred client type for passing through context.
- Pinned, tested versions of the Drizzle stack.

Schemas are deliberately not provided: tables belong to the features that own
them in the consuming application.

## Wiring it up

1. Add the dependencies to the API:

   ```sh
   cd apps/api
   bun add @repo/db-drizzle@workspace:* drizzle-orm
   bun add -D drizzle-kit
   ```

   (`drizzle-orm` is needed directly for `pgTable` and query helpers;
   `drizzle-kit` generates and runs migrations.)

2. Declare `DATABASE_URL` in `apps/api/src/env.ts`:

   ```ts
   DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
   ```

3. Create the client once, beside the composition root:

   ```ts
   // apps/api/src/db.ts
   import { createDb } from '@repo/db-drizzle'

   import { env } from './env'

   export const db = createDb(env.DATABASE_URL)
   ```

4. Define your tables. A Drizzle schema is plain TypeScript — the `pgTable`
   definitions are the schema, and drizzle-kit only needs to know where they
   live. Two workable layouts:

   - Colocated (this template's default): each feature owns its tables in
     `src/features/<feature>/tables.ts` (a distinct name so Zod `schema.ts`
     files stay separate).
   - Central: one `src/db/schema.ts` holding every table; set
     `schema: './src/db/schema.ts'` below instead.

   Then point `drizzle.config.ts` at them:

   ```ts
   // apps/api/drizzle.config.ts
   import { defineConfig } from 'drizzle-kit'

   export default defineConfig({
     dialect: 'postgresql',
     schema: './src/features/**/tables.ts',
     out: './drizzle',
     dbCredentials: { url: process.env.DATABASE_URL ?? '' },
   })
   ```

5. Add migration scripts to `apps/api/package.json` and treat the generated
   `drizzle/` directory as committed source:

   ```json
   "db:generate": "drizzle-kit generate",
   "db:migrate": "drizzle-kit migrate",
   "db:studio": "drizzle-kit studio"
   ```

## Removing it

```sh
rm -rf modules/db-drizzle && bun install
```

## Notes

- Module tests run against in-memory PGlite; verify migrations and queries
  against a real PostgreSQL when wiring up.
- Check current Drizzle documentation before wiring or upgrading — drizzle-kit
  driver support for `bun-sql` has open edges; the config above uses kit's own
  connection via `dbCredentials`, which is independent of the runtime driver.
