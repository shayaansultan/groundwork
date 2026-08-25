import { createContext, useContext } from 'react'

const themes = ['light', 'dark'] as const

export type Theme = (typeof themes)[number]

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && themes.some((theme) => theme === value)
}

export interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'light',
  setTheme: () => null,
})

export function useTheme() {
  return useContext(ThemeProviderContext)
}
