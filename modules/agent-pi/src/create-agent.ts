import type { Api, Model, ThinkingLevel } from '@earendil-works/pi-ai'
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type ToolDefinition,
} from '@earendil-works/pi-coding-agent'

export type AgentSession = Awaited<ReturnType<typeof createAgentSession>>['session']

export interface CreateAgentOptions {
  /** The model to run, resolved explicitly — this module sets no default provider. */
  model: Model<Api>
  /** API key for the model's provider. Held in memory only, never persisted. */
  apiKey: string
  /** Replaces the default coding-agent system prompt entirely. */
  systemPrompt: string
  /** Custom tools with TypeBox parameter schemas. */
  tools?: ToolDefinition[]
  /**
   * Built-in coding tool names to enable ('read', 'bash', 'edit', 'write',
   * 'grep', 'find', 'ls'). Default: none — a server-embedded agent gets no
   * file or shell access unless explicitly granted.
   */
  builtinTools?: string[]
  thinkingLevel?: ThinkingLevel
  /** Working directory for built-in tools when enabled. Default: process.cwd(). */
  cwd?: string
}

export async function createAgent(options: CreateAgentOptions): Promise<AgentSession> {
  const cwd = options.cwd ?? process.cwd()
  const modelRuntime = await ModelRuntime.create()
  await modelRuntime.setRuntimeApiKey(options.model.provider, options.apiKey)

  // Everything ambient is disabled: no extension, skill, prompt-template, or
  // context-file discovery from the user's home directory or the cwd. The
  // agentDir is pinned to cwd so ~/.pi/agent is never read.
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir: cwd,
    noContextFiles: true,
    noExtensions: true,
    noPromptTemplates: true,
    noSkills: true,
    noThemes: true,
    systemPromptOverride: () => options.systemPrompt,
    appendSystemPromptOverride: () => [],
  })
  await resourceLoader.reload()

  const builtinTools = options.builtinTools ?? []
  const customTools = options.tools ?? []

  const { session } = await createAgentSession({
    cwd,
    modelRuntime,
    model: options.model,
    resourceLoader,
    sessionManager: SessionManager.inMemory(),
    settingsManager: SettingsManager.inMemory({}),
    customTools,
    // An allowlist admits custom tools by name; with no built-ins requested we
    // suppress the default read/bash/edit/write set instead.
    ...(builtinTools.length > 0
      ? { tools: [...builtinTools, ...customTools.map((tool) => tool.name)] }
      : { noTools: 'builtin' as const }),
    ...(options.thinkingLevel === undefined ? {} : { thinkingLevel: options.thinkingLevel }),
  })

  return session
}

/** Runs one prompt to completion and returns the assistant's streamed text. */
export async function promptText(session: AgentSession, prompt: string): Promise<string> {
  let text = ''
  const unsubscribe = session.subscribe((event) => {
    if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
      text += event.assistantMessageEvent.delta
    }
  })

  try {
    await session.prompt(prompt)
  } finally {
    unsubscribe()
  }

  return text
}
