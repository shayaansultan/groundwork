import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PGlite } from '@electric-sql/pglite'
import { eq, sql } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/pglite'

import { createDb } from './create-db'

// Internal test-only schema. Consuming applications define their own tables
// beside their features; nothing here is exported.
const notes = pgTable('notes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// The runtime factory uses Bun.SQL against a real Postgres; tests exercise the
// same Drizzle query layer through in-process PGlite so `bun run check` needs
// no database server.
const client = new PGlite()
const db = drizzle({ client })

beforeAll(async () => {
  await db.execute(sql`
    CREATE TABLE "notes" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "title" text NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    )
  `)
})

afterAll(async () => {
  await client.close()
})

describe('drizzle query layer', () => {
  test('inserts and returns typed rows', async () => {
    const [inserted] = await db.insert(notes).values({ title: 'first' }).returning()

    expect(inserted?.id).toBe(1)
    expect(inserted?.title).toBe('first')
    expect(inserted?.createdAt).toBeInstanceOf(Date)
  })

  test('filters with typed conditions', async () => {
    await db.insert(notes).values({ title: 'second' })

    const rows = await db.select().from(notes).where(eq(notes.title, 'second'))

    expect(rows).toHaveLength(1)
    expect(rows[0]?.title).toBe('second')
  })

  test('updates and deletes', async () => {
    const [updated] = await db
      .update(notes)
      .set({ title: 'renamed' })
      .where(eq(notes.title, 'first'))
      .returning()

    expect(updated?.title).toBe('renamed')

    await db.delete(notes).where(eq(notes.title, 'renamed'))
    const remaining = await db.select().from(notes)

    expect(remaining).toHaveLength(1)
  })
})

describe('createDb', () => {
  test('constructs a lazy client without connecting', () => {
    const lazy = createDb('postgres://nobody:nothing@localhost:5432/unreachable')

    expect(typeof lazy.select).toBe('function')
    expect(typeof lazy.transaction).toBe('function')
  })
})
