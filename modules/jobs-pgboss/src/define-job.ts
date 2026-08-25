import type { Queue } from 'pg-boss'
import type { z } from 'zod'

export interface JobDefinition<Schema extends z.ZodType = z.ZodType> {
  name: string
  /** Validates payloads on send and again on receipt; persisted JSON is untrusted. */
  schema: Schema
  handler: (payload: z.output<Schema>) => Promise<void>
  /** Queue configuration such as retryLimit, retryDelay, retryBackoff, deadLetter. */
  queue?: Partial<Omit<Queue, 'name'>>
}

export function defineJob<Schema extends z.ZodType>(
  definition: JobDefinition<Schema>,
): JobDefinition<Schema> {
  return definition
}
