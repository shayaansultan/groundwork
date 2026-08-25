import { revalidateLogic, useForm } from '@tanstack/react-form'
import { CheckCircle2 } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { trpc } from '@/lib/trpc'

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
})

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Enter a valid value'
}

export function WaitlistForm() {
  const joinWaitlist = trpc.waitlist.join.useMutation()
  const form = useForm({
    defaultValues: {
      email: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: waitlistSchema,
    },
    onSubmit: async ({ value }) => {
      const input = waitlistSchema.parse(value)
      await joinWaitlist.mutateAsync(input)
    },
  })

  if (joinWaitlist.data) {
    return (
      <div className="flex items-baseline gap-2 text-sm">
        <CheckCircle2 className="size-4 self-center text-emerald-600" aria-hidden />
        <p>
          Accepted {joinWaitlist.data.email}.{' '}
          <span className="text-muted-foreground">
            Replace this example with your first real feature.
          </span>
        </p>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {(field) => {
          const fieldError = field.state.meta.isValid
            ? undefined
            : field.state.meta.errors.map(getErrorMessage).join(', ')
          const mutationError = joinWaitlist.error?.message
          const error = fieldError ?? mutationError

          return (
            <div className="space-y-2">
              <label className="sr-only" htmlFor={field.name}>
                Email address
              </label>
              <div className="flex gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="flex-1"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={fieldError !== undefined}
                  aria-describedby={error === undefined ? undefined : `${field.name}-error`}
                />
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? 'Sending…' : 'Join'}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
              {error === undefined ? (
                <p className="text-[13px] leading-[19px] text-muted-foreground">
                  Validated with Zod, sent through tRPC, cached by React Query.
                </p>
              ) : (
                <p
                  id={`${field.name}-error`}
                  className="text-[13px] leading-[19px] text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>
    </form>
  )
}
