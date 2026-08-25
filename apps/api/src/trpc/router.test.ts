import { describe, expect, test } from 'bun:test'

import { createCaller } from './router'

describe('appRouter', () => {
  test('returns typed status data', async () => {
    const caller = createCaller({ requestId: 'test-request' })
    const result = await caller.status.check()

    expect(result.status).toBe('ok')
    expect(result.requestId).toBe('test-request')
    expect(result.time).toBeInstanceOf(Date)
  })
})
