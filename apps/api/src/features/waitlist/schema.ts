import { z } from 'zod'

export const joinWaitlistInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
})

export type JoinWaitlistInput = z.infer<typeof joinWaitlistInput>
