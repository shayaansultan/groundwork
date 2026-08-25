import type { JoinWaitlistInput } from './schema'

export function joinWaitlist(input: JoinWaitlistInput) {
  return {
    acceptedAt: new Date(),
    email: input.email,
  }
}
