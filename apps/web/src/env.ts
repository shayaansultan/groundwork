import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const rootRelativeUrl = z.string().regex(/^\/(?!\/)/, 'Must be a root-relative path')
const absoluteHttpUrl = z.url({
  protocol: /^https?$/,
})

export const apiUrlSchema = z
  .string()
  .trim()
  .pipe(z.union([rootRelativeUrl, absoluteHttpUrl]))

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: apiUrlSchema.default('/trpc'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
