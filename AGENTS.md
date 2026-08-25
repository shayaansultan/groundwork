# Repository instructions

## Purpose

This is Groundwork, a deliberately small full-stack TypeScript template.
Preserve its simplicity. Start concrete, colocate by feature, and extract boundaries only
after the code demonstrates a need for them.

Before editing a subtree, read its nearest `AGENTS.md` even if the current agent
does not automatically load nested instruction files.

## How to read these instructions

These files record the template's current conventions so that changes stay
coherent. They are not immutable rules, and the template itself is the product:
it exists to be changed, edited, and updated. When the owner directs a change
that contradicts something written here, make the change and update the
affected `AGENTS.md` and `README.md` in the same pass so the documentation
keeps matching reality. Treat the conventions as defaults for decisions nobody
has weighed in on — never as grounds to resist an explicit decision.

## Source of truth

- Use Bun for dependency management, workspace scripts, and the API runtime.
- Use `bun install`, `bun run`, and `bunx`. Do not introduce npm, pnpm, Yarn, or
  a second lockfile.
- Root `package.json` scripts are the stable command interface. Prefer them over
  invoking underlying tools directly: `bun run setup` (bootstrap a clone),
  `dev`, `check` (format, lint, typecheck, test, build — must pass before
  handoff), `format`, `clean`, and `reset`.
- Vite owns the web build. TypeScript owns type-checking; successfully running a
  `.ts` file with Bun is not a type-check.
- Oxlint owns linting and Oxfmt owns formatting. Do not add ESLint, Prettier, or
  overlapping formatter/linter plugins unless a demonstrated rule gap requires
  a narrowly scoped exception.
- Use the latest stable dependency releases that satisfy the complete toolchain.
  Do not use beta, RC, canary, nightly, or `next` tags in this template. Before
  upgrading, check peer ranges and run the full verification suite; never hide
  an unsupported-version warning.
- Before adding a dependency, check whether the repository or platform already
  provides the capability — Bun's standard library grows release to release,
  so consult its current documentation rather than assuming a gap. Prefer
  maintained libraries over local frameworks.
- Bun ships a lot of built-in functionality: web-standard APIs, a test runner
  (`bun:test`), a shell (`Bun.$`), file I/O (`Bun.file`, `Bun.write`), glob
  matching (`Bun.Glob`), password hashing (`Bun.password`), SQLite, Postgres,
  and Redis clients (`bun:sqlite`, `Bun.sql`, `Bun.redis`), compression,
  `Bun.randomUUIDv7`, and more. In code Bun executes, reach for those
  built-ins before adding an external library or falling back to a `node:*`
  compatibility import.
- Assume model knowledge of versions, APIs, and ecosystem state is stale.
  Before adding or upgrading a dependency, relying on an external API, or
  calling anything "latest", verify against current sources: the registry
  (`bun outdated`), official documentation, and release notes. Never present
  remembered information as current.

## Current architecture

```text
apps/web  -- typed tRPC client -->  apps/api
```

- `apps/web` is a client-rendered React application.
- `apps/api` is a Bun HTTP server exposing tRPC.
- `modules/*` are dormant capability packages (see the Modules section); the
  applications do not import them.
- There is intentionally no `packages/`, `core/`, `domain/`, `contracts/`,
  `config/`, or `tooling/` directory.
- The API router type is the current frontend/backend contract. The web app may
  import it only with `import type` through `@repo/api/router`.

## Boundary extraction rules

- Keep code in the application that owns it by default.
- Do not create a workspace package for one consumer.
- Extract a package when code has at least two real runtime consumers or when an
  enforced dependency boundary has become materially useful.
- Extract one cohesive capability at a time; never create empty architectural
  layers in anticipation of possible future work.
- Possible future packages are descriptive, not prescribed:
  - `packages/core` when API and worker execute the same business use cases.
  - `packages/jobs` when producers and consumers share durable job schemas.
  - `packages/contracts` when non-tRPC consumers need transport-neutral schemas.
  - `packages/db` when more than one runtime genuinely shares database access.
- Do not introduce repositories, ports, service interfaces, factories, or
  dependency injection containers speculatively. Add an abstraction at a real
  external boundary, for a second implementation, or when focused testing
  requires substitution.

## Modules

- `modules/*` are dormant, self-contained capability packages that ship with
  the template: functional and tested, but wired into nothing. A project
  adopts one by depending on it and following its `MODULE.md`; a project that
  does not want one deletes its directory and runs `bun install`.
- Never import a module from `apps/*` in this template repository. The demo
  application stays module-free so deleting any module is always safe.
- Each module owns its dependencies, its tests, and a `MODULE.md` describing
  what it provides, how to wire it up, and how to remove it.
- Modules must stay covered by `bun run check` even though nothing imports
  them; dormant code that is not verified is dead code.
- Integration between modules must be optional and documented, never a hard
  dependency between dormant packages.
- `modules/` is not `packages/`: a future `packages/` directory holds code
  extracted out of applications once it has real consumers, and deleting one
  breaks the build. Deleting a module never does.

## File organization

- Organize application code by feature, not by global technical buckets.
- Prefer a shallow feature directory until its size justifies another level.
- Use kebab-case filenames and named exports.
- Use direct imports inside applications and packages.
- Do not add convenience barrel files to component, hook, route, or feature
  directories.
- A genuine package or feature boundary may expose a small public entrypoint.
  Internal files must never import through their own public entrypoint.
- Prefer explicit package subpath exports over broad `export *` barrels.
- Do not create miscellaneous `utils.ts`, `helpers.ts`, or `services.ts` dumping
  grounds. Name a module after the capability it owns.

## TypeScript and validation

- Keep strict TypeScript settings enabled. Do not weaken compiler rules to make
  an implementation pass.
- Avoid `any`, non-null assertions, and unchecked type casts. Narrow unknown
  values or validate them.
- Use `import type` for type-only dependencies.
- Types do not validate runtime input. Use Zod at untrusted boundaries such as
  environment variables, forms, URL search parameters, RPC inputs, webhooks,
  job payloads, and persisted JSON.
- Define application environment contracts with `@t3-oss/env-core` and Zod in
  that application's `src/env.ts`. Set `emptyStringAsUndefined: true`, declare
  server variables under `server`, and declare browser variables under `client`
  with the `VITE_` prefix.
- Keep schemas close to the boundary or feature that owns them. Do not create a
  global schema directory.

## API and business logic

- Keep tRPC procedures thin: authorize, validate, call feature logic, and map
  the result.
- Do not bury business rules in routers, React components, database models, or
  queue handlers.
- Use typed feature errors where callers need to distinguish expected failures.
- Keep environment access in the application's `env.ts`; do not scatter
  `process.env` or `Bun.env` reads.
- Never expose secrets to the web app. Only explicitly validated `VITE_*`
  variables may enter the browser bundle.

## Frontend defaults

- Keep the frontend a Vite SPA. Do not introduce Next.js or server-component
  conventions unless a task explicitly changes the architecture.
- Use TanStack Router for navigation and typed URL state.
- Use React Query, including the tRPC integration, for server state. Do not fetch
  server data with effects or create a second server-state cache.
- Use TanStack Form with Zod-backed validation for nontrivial forms.
- Use shadcn-style local primitives from `apps/web/src/components/ui`. Compose
  feature-specific components outside that directory.
- The canonical shadcn design system is preset `b5KHubfAu`: Radix Mira, neutral
  base, sky theme and charts, Lucide icons, variable Inter, and the default
  radius. Do not substitute another preset or partially recreate this theme.
- When initializing or repairing the design system, apply the complete preset
  with `bunx --bun shadcn@latest apply --preset b5KHubfAu --yes --cwd apps/web`.
  A full apply is intentional: regenerate installed primitives and then review
  the result as one coherent design-system update.
- Add registry components with the shadcn CLI; do not hand-copy or recreate a
  registry component that the CLI provides. From the repository root, run
  `bunx --bun shadcn@latest add <component> --cwd apps/web`.
- Treat `apps/web/components.json` as the shadcn source of truth. Preview updates
  to an existing component with `--diff`; use `--overwrite` only when deliberately
  accepting the registry version, then reapply intentional local changes.
- shadcn components are owned source code after generation. Customization is
  expected, but keep reusable primitives generic and review upstream diffs before
  replacing customized files.
- Preserve semantic HTML, keyboard access, visible focus states, useful labels,
  and understandable loading and error states.

## Persistence and workers

- Do not add a database, ORM, queue, or worker until a feature needs it.
- When persistence is introduced, prefer Drizzle unless project requirements
  justify another choice. Treat migrations as committed source code.
- Do not expose ORM rows as API contracts; map deliberately at the boundary.
- When jobs are introduced, validate payloads, version durable schemas, make
  handlers idempotent, and assume retries and duplicate delivery.

## Tests and verification

- During implementation, run the smallest check that covers the changed code.
- Before handing off a material change, run `bun run check` from the repository
  root.
- Unit-test business behavior without HTTP where possible.
- Test API wiring at the router boundary and UI behavior through user-visible
  interactions.
- Add Playwright only when the first critical cross-application flow warrants
  end-to-end coverage.
- Do not rely on snapshots for behavior that can be asserted directly.
- If a required check cannot run, report exactly what was skipped and why.

## Change discipline

- Read nearby code and configuration before introducing a new pattern.
- Keep changes scoped to the requested outcome; do not bundle speculative
  refactors.
- Preserve unrelated user changes and never overwrite them to simplify a task.
- Update documentation and `.env.example` files when commands or configuration
  change.
- Comments should explain non-obvious reasons and constraints, not narrate code.
- Do not initialize Git, commit, push, publish, deploy, or mutate external
  services unless the user explicitly requests it. Commits mark milestones the
  owner defines; never commit routine changes unprompted.
