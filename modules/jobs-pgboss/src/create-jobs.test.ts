import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PGlite } from '@electric-sql/pglite'
import { z } from 'zod'

import { createJobs } from './create-jobs'
import { defineJob } from './define-job'
import { fromPglite } from './index'

const seen: string[] = []

const echoJob = defineJob({
  name: 'echo',
  schema: z.object({ value: z.string() }),
  handler: async (payload) => {
    seen.push(payload.value)
  },
  queue: { retryLimit: 0 },
})

const pglite = new PGlite()
const errors: Error[] = []
const jobs = createJobs(
  {
    backend: 'pglite',
    db: fromPglite(pglite),
    __test__enableSpies: true,
  },
  { onError: (error: Error) => errors.push(error) },
)

beforeAll(async () => {
  await jobs.start([echoJob])
  await jobs.work([echoJob], { pollingIntervalSeconds: 0.5 })
})

afterAll(async () => {
  await jobs.stop()
  await pglite.close()
})

describe('jobs', () => {
  test('sends, works, and completes a validated job', async () => {
    const spy = jobs.boss.getSpy('echo')

    const jobId = await jobs.send(echoJob, { value: 'ping' })
    expect(jobId).toBeTruthy()

    await spy.waitForJob((data) => (data as { value: string }).value === 'ping', 'completed')
    expect(seen).toEqual(['ping'])
  })

  test('rejects an invalid payload before it is enqueued', () => {
    expect(jobs.send(echoJob, { value: 123 as unknown as string })).rejects.toThrow()
  })

  test('fails a job whose stored payload no longer parses', async () => {
    const spy = jobs.boss.getSpy('echo')

    // Bypasses send-side validation, simulating a poisoned or outdated payload.
    const jobId = await jobs.boss.send('echo', { wrong: true })
    expect(jobId).toBeTruthy()

    if (jobId) {
      await spy.waitForJobWithId(jobId, 'failed')
    }
    expect(seen).toEqual(['ping'])
  })

  test('registers a cron schedule', async () => {
    await jobs.schedule(echoJob, '0 3 * * *', { value: 'nightly' })

    const schedules = await jobs.boss.getSchedules()
    expect(schedules.some((entry) => entry.name === 'echo' && entry.cron === '0 3 * * *')).toBe(
      true,
    )
  })
})
