import { afterAll, describe, expect, test } from 'bun:test'
import type { Api, Model } from '@earendil-works/pi-ai'
import type { ToolDefinition } from '@earendil-works/pi-coding-agent'
import { Type } from 'typebox'

import { createAgent, promptText } from './create-agent'

const echoParams = Type.Object({ value: Type.String() })

const echoTool = (onCall: (value: string) => void): ToolDefinition<typeof echoParams> => ({
  name: 'echo',
  label: 'Echo',
  description: 'Echoes a value back.',
  parameters: echoParams,
  execute: async (_toolCallId, params) => {
    onCall(params.value)
    return { content: [{ type: 'text', text: params.value }], details: {} }
  },
})

// A scripted OpenAI-completions endpoint: each request pops the next response
// off the script, so multi-turn tool flows can be exercised without a network
// or an API key.
type ScriptedResponse =
  | { kind: 'text'; text: string }
  | { kind: 'toolCall'; name: string; args: Record<string, unknown> }

const script: ScriptedResponse[] = []
const requests: unknown[] = []

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`
}

function chunk(delta: Record<string, unknown>, finish: string | null) {
  return {
    id: 'chatcmpl-fake',
    object: 'chat.completion.chunk',
    created: 0,
    model: 'fake-model',
    choices: [{ index: 0, delta, finish_reason: finish }],
  }
}

const server = Bun.serve({
  port: 0,
  async fetch(request) {
    requests.push(await request.json())
    const next = script.shift()

    if (!next) {
      return new Response('script exhausted', { status: 500 })
    }

    let body = sse(chunk({ role: 'assistant' }, null))

    if (next.kind === 'text') {
      for (const part of next.text.split(' ')) {
        body += sse(chunk({ content: `${part} ` }, null))
      }
      body += sse(chunk({}, 'stop'))
    } else {
      body += sse(
        chunk(
          {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                type: 'function',
                function: { name: next.name, arguments: JSON.stringify(next.args) },
              },
            ],
          },
          null,
        ),
      )
      body += sse(chunk({}, 'tool_calls'))
    }

    body += 'data: [DONE]\n\n'

    return new Response(body, {
      headers: { 'content-type': 'text/event-stream' },
    })
  },
})

afterAll(async () => {
  await server.stop(true)
})

// Uses a known provider id so auth resolution accepts the runtime API key; it
// must be a provider that speaks openai-completions (the 'openai' id routes
// through the Responses API instead). The baseUrl points every request at the
// local scripted server.
const fakeModel: Model<Api> = {
  id: 'fake-model',
  name: 'Fake Model',
  api: 'openai-completions',
  provider: 'groq',
  baseUrl: `http://localhost:${server.port}/v1`,
  reasoning: false,
  input: ['text'],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128_000,
  maxTokens: 8192,
}

describe('createAgent', () => {
  test('streams a text answer through the agent loop', async () => {
    script.push({ kind: 'text', text: 'Hello from the fake model.' })

    const session = await createAgent({
      model: fakeModel,
      apiKey: 'test-key',
      systemPrompt: 'You are a test assistant.',
    })

    try {
      const text = await promptText(session, 'Say hello.')
      expect(text.trim()).toBe('Hello from the fake model.')
    } finally {
      session.dispose()
    }
  })

  test('sends the custom system prompt and no built-in tools', async () => {
    requests.length = 0
    script.push({ kind: 'text', text: 'ok' })

    const session = await createAgent({
      model: fakeModel,
      apiKey: 'test-key',
      systemPrompt: 'MARKER_PROMPT',
    })

    try {
      await promptText(session, 'hi')

      const body = requests[0] as {
        messages: { role: string; content: string }[]
        tools?: unknown[]
      }
      expect(body.messages[0]?.role).toBe('system')
      expect(body.messages[0]?.content).toContain('MARKER_PROMPT')
      expect(body.tools ?? []).toHaveLength(0)
    } finally {
      session.dispose()
    }
  })

  test('executes a custom tool and completes the follow-up turn', async () => {
    const seen: string[] = []
    script.push({ kind: 'toolCall', name: 'echo', args: { value: 'ping' } })
    script.push({ kind: 'text', text: 'The tool said ping.' })

    const session = await createAgent({
      model: fakeModel,
      apiKey: 'test-key',
      systemPrompt: 'You are a test assistant.',
      tools: [echoTool((value) => seen.push(value))],
    })

    try {
      const text = await promptText(session, 'Use the echo tool.')

      expect(seen).toEqual(['ping'])
      expect(text.trim()).toBe('The tool said ping.')
    } finally {
      session.dispose()
    }
  })
})
