# Groundwork

A deliberately small full-stack TypeScript workspace to build on:

- Bun workspaces and backend runtime
- Vite + React
- TanStack Router, Query, and Form
- tRPC for end-to-end API types
- T3 Env Core and Zod for type-safe environment variables
- Zod for runtime validation
- Tailwind CSS and shadcn preset `b5KHubfAu` (Radix Mira, Sky, Inter)
- Class-based light/dark theming with a persisted toggle, defaulting to light
- Oxlint and Oxfmt with TypeScript 7

There is no speculative `packages/` or `tooling/` directory. Code begins in the
application that owns it and is extracted only after a real second consumer or
dependency boundary appears.

## Start

```sh
bun install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
bun run dev
```

The web app runs on <http://localhost:5173> and proxies `/trpc` to the API at
<http://localhost:3000> during development.

## Environment variables

Each application owns and validates its environment in `src/env.ts` with
`@t3-oss/env-core` and Zod. Empty values are treated as missing so schema
defaults work consistently.

- API variables are server-only and read from `Bun.env`.
- Browser variables must be declared with the `VITE_` prefix and are read from
  `import.meta.env`.
- Application code imports the validated `env` object instead of reading the
  runtime environment directly.

Keep examples in each application's `.env.example`; never put secrets in the
web application's environment.

## Commands

```sh
bun run dev
bun run check
bun run format
```

## Production

```sh
bun run build
```

- `apps/api`: run the bundled server with `bun run start` (reads `PORT`).
- `apps/web`: serve the static `apps/web/dist` from any web server or CDN.

Serve both same-origin by proxying `/trpc` to the API, mirroring the dev setup.
To host the API on a different origin instead, set `VITE_API_URL` to the API's
absolute `/trpc` URL at web build time and set `CORS_ORIGIN` on the API to the
web app's origin.

## Conventions

Read `AGENTS.md` before making structural changes. Each application extends it
with its own instructions in `apps/web/AGENTS.md` and `apps/api/AGENTS.md`.
