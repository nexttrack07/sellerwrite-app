import React, { useEffect, useState } from 'react'
import { SunIcon, MoonIcon, PaletteIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'

// Available daisyUI themes
const themes = [
  { name: 'light', type: 'light' },
  { name: 'dark', type: 'dark' },
  { name: 'cupcake', type: 'light' },
  { name: 'bumblebee', type: 'light' },
  { name: 'emerald', type: 'light' },
  { name: 'corporate', type: 'light' },
  { name: 'synthwave', type: 'dark' },
  { name: 'retro', type: 'light' },
  { name: 'cyberpunk', type: 'dark' },
  { name: 'valentine', type: 'light' },
  { name: 'halloween', type: 'dark' },
  { name: 'garden', type: 'light' },
  { name: 'forest', type: 'dark' },
  { name: 'aqua', type: 'light' },
  { name: 'lofi', type: 'light' },
  { name: 'pastel', type: 'light' },
  { name: 'fantasy', type: 'light' },
  { name: 'wireframe', type: 'light' },
  { name: 'black', type: 'dark' },
  { name: 'luxury', type: 'dark' },
  { name: 'dracula', type: 'dark' },
  { name: 'cmyk', type: 'light' },
  { name: 'autumn', type: 'light' },
  { name: 'business', type: 'light' },
  { name: 'acid', type: 'light' },
  { name: 'lemonade', type: 'light' },
  { name: 'night', type: 'dark' },
  { name: 'coffee', type: 'dark' },
  { name: 'winter', type: 'light' },
]

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState('light')

  useEffect(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // If theme is saved in localStorage, use that, otherwise use system preference
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setCurrentTheme(initialTheme)

    // Set initial theme
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  const setTheme = (theme: string) => {
    setCurrentTheme(theme)
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)

    // Dispatch a custom event that the root component can listen for
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }))
  }

  // Find the current theme object
  const theme = themes.find((t) => t.name === currentTheme) || themes[0]
  const isDark = theme.type === 'dark'

  return (
    <div className="flex items-center gap-2">
      {/* Quick toggle between light and dark */}
      <label className="swap swap-rotate">
        <input type="checkbox" checked={isDark} onChange={() => setTheme(isDark ? 'light' : 'dark')} />
        <SunIcon className="swap-off w-5 h-5" />
        <MoonIcon className="swap-on w-5 h-5" />
      </label>

      {/* Theme selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <PaletteIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="theme-dropdown w-48 max-h-80 overflow-y-auto bg-base-100 border border-base-300 shadow-lg"
          sideOffset={5}
        >
          <div className="py-2 px-3 border-b border-base-300">
            <p className="text-sm font-medium">Select Theme</p>
          </div>
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.name}
              className="flex items-center gap-2 capitalize cursor-pointer py-2 px-3 hover:bg-base-200"
              onClick={() => setTheme(theme.name)}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  theme.type === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-gray-200 border border-gray-300'
                }`}
              />
              <span className="flex-1">{theme.name}</span>
              {currentTheme === theme.name && <span className="text-primary">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
