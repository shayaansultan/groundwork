# mcp-official module

An MCP (Model Context Protocol) server for your application, built on the
official TypeScript SDK ([`@modelcontextprotocol/server`](https://github.com/modelcontextprotocol/typescript-sdk)
v2, the stable line released with the 2026-07-28 spec). It exposes your
feature logic to AI agents as typed, Zod-validated tools over Streamable
HTTP — the headless counterpart to the tRPC surface the web app uses.

This module ships dormant: nothing in `apps/` imports it. Its tests run a
real MCP client against a real server on a random port, so `bun run check`
needs no external services.

## Scope

Tools only, stateless, over Streamable HTTP. Deliberately not covered:
resources, prompts, sampling, elicitation, sessions, and auth. When you need
those, use the SDK directly — `createServer()` returns the underlying
`McpServer` with all tools registered, so you can add more surface to it and
serve it yourself. For auth, the SDK ships `requireBearerAuth` middleware.

Curate tools; do not mirror your RPC surface. Agents do better with a few
coarse, well-described tools than with one tool per procedure. tRPC stays the
exhaustive internal contract for the UI; MCP is the small, agent-facing
subset. Both call the same feature logic and neither knows about the other.

## What it provides

- `defineMcpTool({ name, description, schema, handler })` — a typed tool:
  the SDK validates input against the Zod schema before the handler runs.
  Handlers return a string (sent as text content) or a full `CallToolResult`
  for structured output. Thrown errors surface as tool errors.
- `createMcp({ name, version, tools, allowedHosts, allowedOrigins })` — the
  runtime: `fetch` is a web-standard handler to mount in `Bun.serve`, and
  `createServer` is the SDK escape hatch described above.

Requests are guarded before they reach the protocol handler: the Host header
must be allowlisted (DNS-rebinding protection) and browser requests must come
from an allowlisted Origin. Both default to localhost only — **production
deployments must pass their public API hostname in `allowedHosts`**.
Requests without an Origin header (normal MCP clients) always pass the
Origin check.

## Where it runs

- **In the API (default)**: mount `mcp.fetch` as a route in `apps/api`'s
  `Bun.serve`. Deploying the API deploys the MCP surface — one process, one
  port, shared environment and logging. The web app talks `/trpc`, agents
  talk `/mcp`, both over the same feature logic. In production, add the
  public hostname to `allowedHosts` and decide on exposure: keep `/mcp` off
  the public internet, or put the SDK's `requireBearerAuth` in front of it.
- **Separate app (graduation)**: when agent traffic needs its own auth
  domain, scaling profile, or release cadence, create `apps/mcp` with a
  small entry that builds the same tool list and serves `mcp.fetch` on its
  own port. Two runtimes executing the same business use cases is the
  extraction trigger for `packages/core` described in the root `AGENTS.md`.

## Wiring it up

1. `cd apps/api && bun add @repo/mcp-official@workspace:*`
2. Define tools beside the features that own them, calling the same feature
   logic your tRPC procedures call:

   ```ts
   // apps/api/src/features/status/mcp-tools.ts
   import { defineMcpTool } from '@repo/mcp-official'
   import { z } from 'zod'
   import { checkStatus } from './check-status'

   export const statusTool = defineMcpTool({
     name: 'check-status',
     description: 'Report the current health of the API',
     schema: z.object({}),
     handler: async () => {
       const status = await checkStatus()
       return JSON.stringify(status)
     },
   })
   ```

3. Mount the handler in the composition root:

   ```ts
   // apps/api/src/server.ts
   import { createMcp } from '@repo/mcp-official'

   const mcp = createMcp({
     name: 'my-app',
     version: '1.0.0',
     tools: [statusTool],
     // In production: allowedHosts: ['api.example.com']
   })

   Bun.serve({
     routes: {
       '/mcp': (request) => mcp.fetch(request),
       // ...existing routes
     },
   })
   ```

4. Point an MCP client at `http://localhost:3000/mcp` (for Claude Code:
   `claude mcp add --transport http my-app http://localhost:3000/mcp`).

## Removing it

```sh
rm -rf modules/mcp-official && bun install
```

## Notes

- Serving is stateless: each request builds a fresh server instance from
  your tool list. Keep tool registration cheap and side-effect-free; state
  belongs in your features, not in the MCP layer.
- The handler serves the modern 2026-07-28 protocol and falls back to
  stateless 2025-era serving for older clients (the SDK's default).
- Tool inputs cross a process boundary and are validated by the SDK against
  each tool's schema, satisfying the untrusted-boundary rule in the root
  `AGENTS.md`; handlers receive parsed values.
