import { useEffect, useState, type PropsWithChildren } from 'react'

import { isTheme, ThemeProviderContext, type Theme } from '@/lib/theme'

interface ThemeProviderProps {
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'groundwork-theme',
}: PropsWithChildren<ThemeProviderProps>) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey)
    return isTheme(stored) ? stored : defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme: (next) => {
          localStorage.setItem(storageKey, next)
          setTheme(next)
        },
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}
