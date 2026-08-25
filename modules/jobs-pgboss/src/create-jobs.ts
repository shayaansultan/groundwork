import {
  PgBoss,
  type ConstructorOptions,
  type Job,
  type SendOptions,
  type WorkOptions,
} from 'pg-boss'
import type { z } from 'zod'

import type { JobDefinition } from './define-job'

export interface CreateJobsOptions {
  /**
   * Receives asynchronous errors from pg-boss (connection loss, maintenance
   * failures). Defaults to console.error; an unhandled 'error' event would
   * crash the process.
   */
  onError?: (error: Error) => void
}

export type Jobs = ReturnType<typeof createJobs>

export function createJobs(
  connection: string | ConstructorOptions,
  options: CreateJobsOptions = {},
) {
  const boss = new PgBoss(
    typeof connection === 'string' ? { connectionString: connection } : connection,
  )

  boss.on('error', options.onError ?? ((error) => console.error('pg-boss error', error)))

  return {
    /** The underlying PgBoss instance, for anything this wrapper does not surface. */
    boss,

    /** Connects, runs schema setup, and creates the queues for the given jobs. */
    async start(jobs: JobDefinition[]): Promise<void> {
      await boss.start()

      for (const job of jobs) {
        await boss.createQueue(job.name, job.queue ?? {})
      }
    },

    /** Validates the payload and enqueues the job. */
    async send<Schema extends z.ZodType>(
      job: JobDefinition<Schema>,
      payload: z.input<Schema>,
      sendOptions: SendOptions = {},
    ): Promise<string | null> {
      const data = job.schema.parse(payload)
      return boss.send(job.name, data as object, sendOptions)
    },

    /**
     * Creates or updates a cron schedule for the job. Cluster-safe: pg-boss
     * sends one job per due time across all instances. For simple
     * single-instance scheduling without durability, prefer Bun.cron.
     */
    async schedule<Schema extends z.ZodType>(
      job: JobDefinition<Schema>,
      cron: string,
      payload: z.input<Schema>,
    ): Promise<void> {
      const data = job.schema.parse(payload)
      await boss.schedule(job.name, cron, data as object)
    },

    /**
     * Starts polling workers for the given jobs. Payloads are re-validated on
     * receipt; a job whose stored payload no longer parses fails and follows
     * the queue's retry policy.
     */
    async work(jobs: JobDefinition[], workOptions: WorkOptions = {}): Promise<void> {
      for (const job of jobs) {
        await boss.work(job.name, workOptions, async (batch: Job[]) => {
          for (const entry of batch) {
            await job.handler(job.schema.parse(entry.data))
          }
        })
      }
    },

    async stop(): Promise<void> {
      await boss.stop()
    },
  }
}
