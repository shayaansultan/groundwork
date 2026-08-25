import { statusRouter } from '../features/status/router'
import { waitlistRouter } from '../features/waitlist/router'
import { createCallerFactory, router } from './trpc'

export const appRouter = router({
  status: statusRouter,
  waitlist: waitlistRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
