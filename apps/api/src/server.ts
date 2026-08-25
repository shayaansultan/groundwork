import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { env } from './env'
import { createContext } from './trpc/context'
import { appRouter } from './trpc/router'

function withCors(response: Response): Response {
  if (env.CORS_ORIGIN) {
    response.headers.set('Access-Control-Allow-Origin', env.CORS_ORIGIN)
    response.headers.set('Vary', 'Origin')
  }

  return response
}

const server = Bun.serve({
  port: env.PORT,
  fetch(request) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS' && env.CORS_ORIGIN) {
      return withCors(
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Headers': 'content-type, x-request-id',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Max-Age': '86400',
          },
        }),
      )
    }

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' })
    }

    if (url.pathname.startsWith('/trpc')) {
      return fetchRequestHandler({
        endpoint: '/trpc',
        req: request,
        router: appRouter,
        createContext: () => createContext(request),
      }).then(withCors)
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`API listening on ${server.url.toString()}`)
