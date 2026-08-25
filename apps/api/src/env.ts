import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    // Browser origin allowed to call this API cross-origin, e.g. the deployed
    // web app's https://... origin. Leave unset when the web app reaches the
    // API same-origin through a proxy.
    CORS_ORIGIN: z
      .url({ protocol: /^https?$/ })
      .transform((origin) => new URL(origin).origin)
      .optional(),
  },
  runtimeEnv: Bun.env,
  emptyStringAsUndefined: true,
})
