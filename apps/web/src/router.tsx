import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router'

import { ModeToggle } from '@/components/mode-toggle'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div className="fixed top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <Outlet />
    </>
  ),
  notFoundComponent: () => (
    <main className="grid min-h-dvh place-items-center p-6">
      <p>That page does not exist.</p>
    </main>
  ),
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/routes/home-page'), 'HomePage'),
})

const routeTree = rootRoute.addChildren([homeRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
