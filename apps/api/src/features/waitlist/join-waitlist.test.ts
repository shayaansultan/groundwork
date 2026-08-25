import { describe, expect, test } from 'bun:test'

import { joinWaitlist } from './join-waitlist'
import { joinWaitlistInput } from './schema'

describe('joinWaitlistInput', () => {
  test('normalizes surrounding whitespace and casing', () => {
    const input = joinWaitlistInput.parse({ email: '  Person@Example.com  ' })

    expect(input.email).toBe('person@example.com')
  })

  test('rejects an invalid email address', () => {
    expect(joinWaitlistInput.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('joinWaitlist', () => {
  test('accepts a validated email address', () => {
    const result = joinWaitlist(joinWaitlistInput.parse({ email: 'Person@Example.com' }))

    expect(result.email).toBe('person@example.com')
    expect(result.acceptedAt).toBeInstanceOf(Date)
  })
})
