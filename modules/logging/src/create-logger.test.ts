import { describe, expect, test } from 'bun:test'

import { createLogger } from './create-logger'

function captureRecords(logger: ReturnType<typeof createLogger>) {
  const records: Record<string, unknown>[] = []
  logger.attachTransport((record) => {
    records.push(record as Record<string, unknown>)
  })
  return records
}

describe('createLogger', () => {
  test('masks default secret keys case-insensitively', () => {
    const logger = createLogger('test', { json: true })
    const records = captureRecords(logger)

    logger.info({ Authorization: 'Bearer abc', password: 'hunter2', user: 'ada' }, 'login')

    expect(records).toHaveLength(1)
    const serialized = JSON.stringify(records[0])
    expect(serialized).not.toContain('hunter2')
    expect(serialized).not.toContain('Bearer abc')
    expect(serialized).toContain('ada')
  })

  test('masks additional keys passed as options', () => {
    const logger = createLogger('test', { json: true, maskKeys: ['ssn'] })
    const records = captureRecords(logger)

    logger.info({ ssn: '123-45-6789' }, 'profile')

    expect(JSON.stringify(records[0])).not.toContain('123-45-6789')
  })

  test('child loggers inherit masking and transports', () => {
    const logger = createLogger('parent', { json: true })
    const records = captureRecords(logger)

    const child = logger.child({ name: 'child' })
    child.info({ token: 'tok_live_1' }, 'child log')

    expect(records).toHaveLength(1)
    expect(JSON.stringify(records[0])).not.toContain('tok_live_1')
  })

  test('respects minLevel', () => {
    const logger = createLogger('test', { json: true, minLevel: 'WARN' })
    const records = captureRecords(logger)

    logger.info('dropped')
    logger.warn('kept')

    expect(records).toHaveLength(1)
    expect(JSON.stringify(records[0])).toContain('kept')
  })

  test('attaches static bindings to every record', () => {
    const logger = createLogger('test', { json: true, bindings: { service: 'api' } })
    const records = captureRecords(logger)

    logger.info('with bindings')

    expect(records[0]).toMatchObject({ service: 'api' })
  })
})
