import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'

import { ThemeProvider } from './theme-provider'
import { useTheme } from '@/lib/theme'

function ThemeProbe() {
  const { theme, setTheme } = useTheme()

  return (
    <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme}
    </button>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('light', 'dark')
})

test('defaults to light and toggles to dark on request', async () => {
  const user = userEvent.setup()
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  )

  expect(document.documentElement.classList.contains('light')).toBe(true)

  await user.click(screen.getByRole('button', { name: 'light' }))

  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(localStorage.getItem('groundwork-theme')).toBe('dark')
})

test('restores a stored theme choice', () => {
  localStorage.setItem('groundwork-theme', 'dark')
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  )

  expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument()
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
