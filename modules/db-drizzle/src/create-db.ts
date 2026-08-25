import { drizzle } from 'drizzle-orm/bun-sql'

export type Database = ReturnType<typeof createDb>

// Connects lazily: Bun.SQL opens the connection on the first query, so
// constructing a Database is safe at module load time.
export function createDb(databaseUrl: string): ReturnType<typeof drizzle> {
  return drizzle(databaseUrl)
}
