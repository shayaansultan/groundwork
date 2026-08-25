import { trpc } from '@/lib/trpc'

const principles = [
  {
    number: '01',
    title: 'Two real boundaries',
    description: 'Only the web and API are workspaces, joined by one typed tRPC contract.',
  },
  {
    number: '02',
    title: 'Types end to end',
    description: 'tRPC, React Query, and Zod share a single contract from server to screen.',
  },
  {
    number: '03',
    title: 'No premature structure',
    description: 'Folders, packages, and layers appear when code needs them, not up front.',
  },
  {
    number: '04',
    title: 'Agent-ready',
    description: 'AGENTS.md defines the conventions; every module ships an adoption guide.',
  },
] as const

const modules = [
  {
    name: 'logging-tslog',
    description:
      'Structured logging with secret masking. Pretty in development, JSON in production.',
  },
  {
    name: 'db-drizzle',
    description: 'Drizzle ORM on Bun’s native Postgres client, tested against in-process PGlite.',
  },
  {
    name: 'jobs-pgboss',
    description: 'Durable background jobs and cluster-safe cron on pg-boss, inside your Postgres.',
  },
  {
    name: 'agent-pi',
    description:
      'An embeddable Pi coding agent with custom tools and streaming, server-safe by default.',
  },
  {
    name: 'mcp-official',
    description: 'Your feature logic exposed to AI agents as typed MCP tools over Streamable HTTP.',
  },
] as const

export function HomePage() {
  const status = trpc.status.check.useQuery(undefined, {
    retry: false,
  })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-16">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium">groundwork</span>
        <span className="flex items-center gap-1.75 font-mono text-xs text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${status.isSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`}
            aria-hidden
          />
          {status.isPending
            ? 'connecting…'
            : status.isError
              ? 'api offline · bun run dev'
              : `api connected · ${status.data.requestId.slice(0, 8)}`}
        </span>
      </div>

      <h1 className="mt-14 text-[28px] leading-[34px] font-semibold tracking-tight">
        Everything you need to start. Nothing you have to rip out.
      </h1>
      <p className="mt-3.5 text-[15px] leading-6 text-muted-foreground">
        A full-stack TypeScript template: Bun workspaces, a Vite and React front end, and a Bun API.
        The applications stay deliberately minimal — everything else ships as dormant modules you
        adopt when a feature needs them, or delete without a trace.
      </p>

      <section className="mt-12" aria-labelledby="principles-heading">
        <h2 id="principles-heading" className="font-mono text-xs text-muted-foreground/70">
          principles
        </h2>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {principles.map(({ number, title, description }) => (
            <li
              key={number}
              className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-5"
            >
              <div className="flex items-baseline gap-5">
                <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground/70">
                  {number}
                </span>
                <h3 className="text-sm font-medium sm:w-44 sm:shrink-0">{title}</h3>
              </div>
              <p className="pl-10 text-sm leading-[21px] text-muted-foreground sm:pl-0">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="font-mono text-xs text-muted-foreground/70">
          modules
        </h2>
        <p className="mt-3 text-sm leading-[21px] text-muted-foreground">
          Each module is functional and tested but wired into nothing: the applications import none
          of them, so removal is always safe. Adopting one is a dependency plus its{' '}
          <span className="font-mono text-[13px]">MODULE.md</span> wiring guide; dropping one is
          deleting a directory.
        </p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {modules.map(({ name, description }) => (
            <li key={name} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-5">
              <h3 className="shrink-0 font-mono text-[13px] font-medium sm:w-32">{name}</h3>
              <p className="text-sm leading-[21px] text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-1.5 font-mono text-xs text-muted-foreground">
          <span>
            <span className="text-muted-foreground/60">adopt </span>
            bun add @repo/&lt;name&gt;@workspace:*
          </span>
          <span>
            <span className="text-muted-foreground/60">remove </span>
            rm -rf modules/&lt;name&gt; &amp;&amp; bun install
          </span>
        </div>
      </section>
    </main>
  )
}
