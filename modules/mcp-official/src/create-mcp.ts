import {
  createMcpHandler,
  hostHeaderValidationResponse,
  localhostAllowedHostnames,
  localhostAllowedOrigins,
  McpServer,
  originValidationResponse,
} from '@modelcontextprotocol/server'

import type { McpToolDefinition } from './define-tool'

export interface CreateMcpOptions {
  /** Server name advertised to MCP clients. */
  name: string
  /** Server version advertised to MCP clients. */
  version: string
  tools: readonly McpToolDefinition[]
  /**
   * Hostnames accepted in the Host header (DNS-rebinding protection).
   * Defaults to localhost only; production deployments must add their
   * public API hostname.
   */
  allowedHosts?: string[]
  /**
   * Origin hostnames accepted for browser-initiated requests. Requests
   * without an Origin header (normal MCP clients) always pass. Defaults
   * to localhost only.
   */
  allowedOrigins?: string[]
}

export interface Mcp {
  /** Streamable HTTP entrypoint; mount it as a route in `Bun.serve`. */
  fetch: (request: Request) => Promise<Response>
  /**
   * Builds a server instance with all tools registered. Escape hatch for
   * everything this module does not cover (resources, prompts, stdio):
   * register more surface on the result and serve it with the SDK directly.
   */
  createServer: () => McpServer
}

export function createMcp(options: CreateMcpOptions): Mcp {
  const allowedHosts = options.allowedHosts ?? localhostAllowedHostnames()
  const allowedOrigins = options.allowedOrigins ?? localhostAllowedOrigins()

  const createServer = (): McpServer => {
    const server = new McpServer({ name: options.name, version: options.version })
    for (const tool of options.tools) {
      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.schema },
        async (input) => {
          const result = await tool.handler(input)
          return typeof result === 'string'
            ? { content: [{ type: 'text' as const, text: result }] }
            : result
        },
      )
    }
    return server
  }

  const handler = createMcpHandler(createServer)

  return {
    createServer,
    fetch: async (request) =>
      hostHeaderValidationResponse(request, allowedHosts) ??
      originValidationResponse(request, allowedOrigins) ??
      handler.fetch(request),
  }
}
