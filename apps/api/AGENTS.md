# API instructions

These instructions extend the repository root `AGENTS.md` for `apps/api`.

## Structure

- `src/server.ts` is the Bun HTTP composition root.
- `src/trpc` owns transport concerns: context, procedure construction, and the
  application router.
- `src/features/<feature>` owns schemas, feature behavior, expected errors, and
  its thin tRPC router.
- Add a new feature under `src/features`; do not add global `controllers`,
  `services`, `repositories`, or `schemas` directories.

## tRPC

- Validate every public procedure input with Zod.
- Put authentication and request-scoped dependencies in context or middleware.
- Procedures translate transport input into a feature call. Keep reusable
  behavior in a transport-independent function beside the feature.
- Export only `AppRouter` to the web application. Never import frontend code.
- Map expected feature failures to deliberate tRPC errors at the router edge;
  do not leak internal exceptions or secrets.

## Bun runtime

- Prefer web-standard `Request`, `Response`, `Headers`, and `fetch` APIs.
- Declare and validate server-only variables with `@t3-oss/env-core` and Zod in
  `src/env.ts`; use `Bun.env` only as its `runtimeEnv`.
- Keep startup side effects in `src/server.ts` so router modules remain safe to
  import for tests and type-only consumers.
- Include a lightweight health endpoint for deployment checks.

## Tests

- Use `bun:test`.
- Test feature functions directly, then use `appRouter.createCaller` for
  procedure wiring and validation.
- Keep tests beside the code they cover using `*.test.ts`.
