# Logging module

Structured logging built on [tslog](https://tslog.js.org/) v5: pretty output in
development, newline-delimited JSON for production, and case-insensitive
masking of common secret keys — in one zero-dependency package.

This module ships dormant: nothing in `apps/` imports it. It stays typechecked
and tested by `bun run check` so it is always ready to wire up.

## What it provides

- `createLogger(name, options?)` — a configured tslog `Logger`.
  - `json: true` switches from pretty to JSON output (use in production).
  - `bindings` attaches static fields (service name, version) to every record.
  - `minLevel` filters below the given level.
  - `maskKeys` extends the default secret-key mask list.
- Child loggers via `logger.child({ name, bindings })` inherit configuration.

## Wiring it up

1. Depend on it from the app:

   ```sh
   cd apps/api && bun add @repo/logging-tslog@workspace:*
   ```

2. Create the app's logger beside its composition root, driven by the app's
   validated env (add a variable such as `LOG_JSON` or reuse `NODE_ENV` in
   `src/env.ts` rather than reading the runtime environment directly):

   ```ts
   import { createLogger } from '@repo/logging-tslog'

   import { env } from './env'

   export const logger = createLogger('api', { json: env.NODE_ENV === 'production' })
   ```

3. Pass request-scoped children through context where needed:

   ```ts
   logger.child({ bindings: { requestId } })
   ```

The same `createLogger` works in the browser; only wire it into `apps/web` if
console logging there stops being enough.

## Removing it

```sh
rm -rf modules/logging-tslog && bun install
```

Nothing else references this module until you wire it, so removal is complete.

## Notes

- tslog v5 is ESM-only and masks by property name (`mask.keys`), matched
  case-insensitively. Masking applies to nested objects in log arguments.
- Check current tslog documentation before significant upgrades; v5 grouped
  its settings (`pretty`, `json`, `mask`) and removed the v4 `overwrite` hooks.
