# agent-pi module

An embeddable LLM agent built on [Pi](https://pi.dev)'s SDK
(`@earendil-works/pi-coding-agent` and `@earendil-works/pi-ai`): a
perceive-reason-act loop with streaming events, custom tools, and one-line
provider switching.

This module ships dormant: nothing in `apps/` imports it. Its tests run the
real agent loop against a local scripted model server, so `bun run check`
needs no API keys and no network.

## What it provides

- `createAgent(options)` — an agent session configured for server embedding:
  - The model and API key are explicit; this module sets no default provider
    and never persists credentials.
  - No built-in coding tools unless granted via `builtinTools` — by default a
    server agent cannot read files or run shell commands.
  - No ambient discovery: extensions, skills, and context files from `~/.pi`
    or the working directory are never loaded.
  - `systemPrompt` replaces Pi's default coding prompt entirely.
- `promptText(session, prompt)` — run one prompt, return the streamed text.
- `Type` (TypeBox) re-export — Pi's native schema language for tool
  parameters. Zod stays the tool for app boundaries; agent tool parameters use
  TypeBox because Pi's `ToolDefinition` requires it structurally.
- Streaming: subscribe to session events (`message_update` text deltas,
  `tool_execution_*`, turn and agent lifecycle) for incremental output.

## Wiring it up

1. Depend on it from the API:

   ```sh
   cd apps/api && bun add @repo/agent-pi@workspace:*
   ```

2. Declare the provider key in `apps/api/src/env.ts` (for example
   `ANTHROPIC_API_KEY: z.string().min(1)`), then resolve a model and create
   the agent inside the feature that owns it:

   ```ts
   import { createAgent, promptText } from '@repo/agent-pi'
   import { ModelRuntime } from '@earendil-works/pi-coding-agent'

   import { env } from '../../env'

   const modelRuntime = await ModelRuntime.create()
   const model = modelRuntime.getModel('anthropic', 'claude-sonnet-4-5')
   if (!model) throw new Error('Unknown model')

   const session = await createAgent({
     model,
     apiKey: env.ANTHROPIC_API_KEY,
     systemPrompt: 'You answer questions about this product.',
   })
   ```

3. For streaming over tRPC, yield session events from an async-generator
   procedure instead of awaiting `promptText`; check current tRPC
   documentation for the streaming idiom when wiring.

## Security model

- **Your custom tools are the security boundary.** By default the agent has no
  built-in tools, so it can only do what your tool implementations allow.
  Design them least-privilege: validate inputs, scope filesystem or network
  access inside the tool, and never let a tool's power exceed what the calling
  user is authorized to do.
- **Granting `builtinTools` grants process permissions.** Pi has no built-in
  sandbox — deliberately; its security docs state that real isolation must
  come from the OS or a container boundary. `bash`, `write`, and `edit` run
  with the API process's permissions. If a use case needs them server-side,
  isolate the process (container, VM) or route tool execution into Pi's
  Gondolin micro-VM — see `containerization.md` and `security.md` in the
  installed package's `docs/`.
- **Assume prompt injection.** Anything that reaches the model — user input,
  tool results, retrieved documents — can steer it. Treat every tool call as
  attacker-influenceable: authorize actions in the tool, not in the prompt.

## Growing beyond this module

`createAgent` is a deliberately small entry point, not a fence. The full SDK
is underneath and consuming projects are expected to build on it:

- **Persistence**: sessions here are in-memory and per-process. For durable
  conversations, pass `SessionManager.create(dir)` instead, or persist the
  session state (`session.state.messages`) through your own storage.
- **Multi-user**: a session is a stateful object — create one per
  conversation, not one per server.
- **More SDK**: import `@earendil-works/pi-coding-agent` directly for
  extensions, skills, compaction, steering, or anything else `createAgent`
  does not surface. Copy this module's `create-agent.ts` defaults forward
  when you do, so the server-safety posture survives the graduation.
- **Testing your agent features**: the scripted fake-model server in
  `create-agent.test.ts` is a reusable pattern for testing agent behavior
  without network or keys.

## Removing it

```sh
rm -rf modules/agent-pi && bun install
```

## Notes

- Versions are pinned exactly: Pi is a fast-moving 0.x. Re-read the shipped
  docs (`node_modules/@earendil-works/pi-coding-agent/docs` and `examples/`)
  before wiring or upgrading — they are version-exact, unlike the website.
- Install only the `@earendil-works/*` scoped packages. The bare npm names
  (`pi-ai`, `pi-agent-core`, `pi-coding-agent`) are third-party placeholder
  squats, and the `@mariozechner/*` scope is stale.
- Provider routing quirk: the `openai` provider id routes through the
  Responses API regardless of a model's declared `api`; completions-style
  custom endpoints should use a completions-native provider id (see the test
  fake for a working example).
