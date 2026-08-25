import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Button } from './button'

test('button supports user interaction', async () => {
  const user = userEvent.setup()
  let clicks = 0

  render(<Button onClick={() => clicks++}>Continue</Button>)
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  expect(clicks).toBe(1)
})
