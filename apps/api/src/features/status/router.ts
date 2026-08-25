import { publicProcedure, router } from '../../trpc/trpc'

export const statusRouter = router({
  check: publicProcedure.query(({ ctx }) => ({
    requestId: ctx.requestId,
    status: 'ok' as const,
    time: new Date(),
  })),
})
