import { statusRouter } from '../features/status/router'
import { createCallerFactory, router } from './trpc'

export const appRouter = router({
  status: statusRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
