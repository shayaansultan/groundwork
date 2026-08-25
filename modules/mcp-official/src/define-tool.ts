import type { CallToolResult } from '@modelcontextprotocol/server'
import type { z } from 'zod'

export interface McpToolDefinition<Schema extends z.ZodObject = z.ZodObject> {
  name: string
  description: string
  schema: Schema
  /**
   * Runs with input already validated against `schema` by the MCP server.
   * Return a string for plain text output, or a full `CallToolResult` when
   * the response needs structured content or multiple blocks. Thrown errors
   * surface to the caller as tool errors, not transport failures.
   */
  handler: (input: z.output<Schema>) => Promise<string | CallToolResult>
}

export function defineMcpTool<Schema extends z.ZodObject>(
  definition: McpToolDefinition<Schema>,
): McpToolDefinition<Schema> {
  return definition
}
