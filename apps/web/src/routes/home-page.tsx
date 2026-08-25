import { WaitlistForm } from '@/features/waitlist/waitlist-form'
import { trpc } from '@/lib/trpc'

const principles = [
  {
    number: '01',
    title: 'Two real boundaries',
    description: 'Only the web and API are workspaces. Extract later.',
  },
  {
    number: '02',
    title: 'Types end to end',
    description: 'tRPC, React Query, TanStack Form, and Zod work together.',
  },
  {
    number: '03',
    title: 'Persistence when needed',
    description: 'No speculative ORM, repositories, or domain package.',
  },
] as const

const commands = ['bun run dev', 'bun run check', 'bun run format'] as const

export function HomePage() {
  const status = trpc.status.check.useQuery(undefined, {
    retry: false,
  })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-16">
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
        A small foundation that earns its abstractions.
      </h1>
      <p className="mt-3.5 text-[15px] leading-6 text-muted-foreground">
        Two applications, direct imports, and one typed boundary. Everything else waits for a
        feature that needs it.
      </p>

      <ul className="mt-11 divide-y divide-border border-y border-border">
        {principles.map(({ number, title, description }) => (
          <li
            key={number}
            className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-5"
          >
            <div className="flex items-baseline gap-5">
              <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground/70">
                {number}
              </span>
              <h2 className="text-sm font-medium sm:w-44 sm:shrink-0">{title}</h2>
            </div>
            <p className="pl-10 text-sm leading-[21px] text-muted-foreground sm:pl-0">
              {description}
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-11">
        <h2 className="text-[13px] font-medium">Try the typed API</h2>
        <div className="mt-2.5">
          <WaitlistForm />
        </div>
      </section>

      <div className="mt-13 flex flex-wrap gap-x-4.5 gap-y-1 font-mono text-xs text-muted-foreground/70">
        {commands.map((command, index) => (
          <span key={command} className="flex gap-4.5 whitespace-nowrap">
            {index > 0 ? <span aria-hidden>·</span> : null}
            {command}
          </span>
        ))}
      </div>
    </main>
  )
}
