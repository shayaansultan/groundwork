import { afterAll, describe, expect, test } from 'bun:test'

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { z } from 'zod'

import { createMcp } from './create-mcp'
import { defineMcpTool } from './define-tool'

const handledInputs: Array<{ a: number; b: number }> = []

const add = defineMcpTool({
  name: 'add',
  description: 'Add two numbers',
  schema: z.object({ a: z.number(), b: z.number() }),
  handler: async (input) => {
    handledInputs.push(input)
    return String(input.a + input.b)
  },
})

const mcp = createMcp({ name: 'test-server', version: '0.0.1', tools: [add] })

const server = Bun.serve({ port: 0, fetch: mcp.fetch })

afterAll(async () => {
  await server.stop(true)
})

async function connectClient(): Promise<Client> {
  const client = new Client({ name: 'test-client', version: '0.0.1' })
  const transport = new StreamableHTTPClientTransport(new URL(`http://localhost:${server.port}/`))
  await client.connect(transport)
  return client
}

describe('createMcp', () => {
  test('lists registered tools', async () => {
    const client = await connectClient()
    const { tools } = await client.listTools()
    expect(tools.map((tool) => tool.name)).toContain('add')
    expect(tools.find((tool) => tool.name === 'add')?.description).toBe('Add two numbers')
    await client.close()
  })

  test('calls a tool and returns its text result', async () => {
    const client = await connectClient()
    const result = await client.callTool({ name: 'add', arguments: { a: 2, b: 3 } })
    expect(result.isError).toBeFalsy()
    expect(result.content).toEqual([{ type: 'text', text: '5' }])
    await client.close()
  })

  test('rejects invalid input without running the handler', async () => {
    const client = await connectClient()
    const before = handledInputs.length
    let errored = false
    let result: Awaited<ReturnType<Client['callTool']>> | undefined
    try {
      result = await client.callTool({ name: 'add', arguments: { a: 'two', b: 3 } })
    } catch {
      errored = true
    }
    expect(errored || result?.isError === true).toBe(true)
    expect(handledInputs.length).toBe(before)
    await client.close()
  })

  test('rejects requests with a disallowed Host header', async () => {
    const response = await mcp.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { host: 'evil.example', 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(response.status).toBe(403)
  })

  test('rejects browser requests from a disallowed Origin', async () => {
    const response = await fetch(`http://localhost:${server.port}/`, {
      method: 'POST',
      headers: { origin: 'http://evil.example', 'content-type': 'application/json' },
      body: '{}',
    })
    expect(response.status).toBe(403)
  })
})
