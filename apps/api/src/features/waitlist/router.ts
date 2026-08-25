import { publicProcedure, router } from '../../trpc/trpc'
import { joinWaitlist } from './join-waitlist'
import { joinWaitlistInput } from './schema'

export const waitlistRouter = router({
  join: publicProcedure.input(joinWaitlistInput).mutation(({ input }) => joinWaitlist(input)),
})
