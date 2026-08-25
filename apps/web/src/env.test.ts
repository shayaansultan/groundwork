import { describe, expect, test } from 'vitest'

import { apiUrlSchema } from './env'

describe('apiUrlSchema', () => {
  test.each(['/trpc', '/api/trpc', 'http://localhost:3000/trpc', 'https://api.example.com/trpc'])(
    'accepts %s',
    (value) => {
      expect(apiUrlSchema.parse(value)).toBe(value)
    },
  )

  test('trims surrounding whitespace', () => {
    expect(apiUrlSchema.parse('  /trpc  ')).toBe('/trpc')
  })

  test.each(['trpc', '//example.com/trpc', 'mailto:hello@example.com', 'javascript:alert(1)'])(
    'rejects %s',
    (value) => {
      expect(apiUrlSchema.safeParse(value).success).toBe(false)
    },
  )
})
