# Web instructions

These instructions extend the repository root `AGENTS.md` for `apps/web`.

## Structure

- `src/routes` owns route definitions and route-level composition.
- `src/features/<feature>` owns feature components, forms, schemas, and hooks.
- `src/components/ui` contains shadcn-style primitives only.
- `src/components` (outside `ui`) holds app-level components shared across
  routes, such as the theme provider and mode toggle. Feature-specific
  components belong in `src/features`, not here.
- `src/lib` contains named application-wide infrastructure such as the tRPC
  client, class-name composition, and theme state. Do not use it as a generic
  dumping ground.

## React

- Prefer small components with explicit data flow and composition.
- Do not copy server state into component state.
- Use effects only to synchronize with external systems, not to derive values,
  fetch application data, or react to ordinary user events.
- Keep providers in `src/app-providers.tsx`; do not create provider stacks in
  individual routes.
- Declare browser environment variables with `@t3-oss/env-core` and Zod in
  `src/env.ts`. Expose only explicitly declared `VITE_` variables and read
  `import.meta.env` only as that module's `runtimeEnv`.

## TanStack Router and Query

- Keep route definitions typed and validate meaningful search parameters.
- Use router navigation APIs and `Link`; do not manipulate browser history
  directly.
- Use tRPC React Query hooks for API data. Query keys, invalidation, retries,
  loading states, and errors must remain explicit.
- If a route loader prefetches data, use the same QueryClient as the component
  tree. Do not introduce a separate loader cache.

## Forms and UI

- Preset `b5KHubfAu` is the canonical design system. It must remain fully applied:
  Radix Mira, neutral base, sky theme and charts, Lucide icons, variable Inter,
  and default radius. Do not mix primitives from another shadcn style.
- To reconstruct or intentionally refresh the whole design system, run
  `bunx --bun shadcn@latest apply --preset b5KHubfAu --yes --cwd apps/web` from
  the repository root, then review and verify the complete generated change.
- Dark mode is class-based following shadcn's Vite dark-mode guide: the
  `ThemeProvider` in `src/components/theme-provider.tsx` applies the `.dark`
  class from the stored choice, defaulting to light, and `ModeToggle` flips
  between light and dark. Do not add a second theming mechanism.
- Use TanStack Form for nontrivial forms and Zod for boundary validation.
- Validate on submit and revalidate on change with `revalidateLogic()` so
  corrected input clears errors immediately.
- Parse transformed Zod output explicitly before sending it; form validators do
  not implicitly replace form values with schema output.
- Labels, descriptions, and errors must be programmatically associated with
  controls. Render actionable errors with `role="alert"` where appropriate.
- Add registry primitives from the repository root with
  `bunx --bun shadcn@latest add <component> --cwd apps/web`, or run the equivalent
  command from this directory without `--cwd`.
- Never manually recreate an available registry primitive. Use `--dry-run` to
  inspect a planned addition and `--diff <component>` before updating an existing
  component. Do not use `--overwrite` casually: generated files are locally owned
  and may contain deliberate customizations.
- Let the CLI install component dependencies and update files. After generation,
  run `bun run format` from the root, review every changed file, and run the
  smallest relevant test followed by `bun run check` before handoff.
- Keep business behavior and feature-specific styling out of
  `src/components/ui`; compose primitives in `src/features` instead.
- Test user-visible behavior with Testing Library rather than component
  internals.
