import React, { useEffect, useState } from 'react'

const themes = ['light', 'dark', 'cupcake', 'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'lofi']

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>('light')

  // Initialize theme from localStorage or default to 'light'
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value
    setTheme(newTheme)

    // Save to localStorage
    localStorage.setItem('theme', newTheme)

    // Set the theme on the HTML element directly
    document.documentElement.setAttribute('data-theme', newTheme)

    // Dispatch a custom event that the root component can listen for
    window.dispatchEvent(new CustomEvent('themechange', { detail: newTheme }))
  }

  return (
    <select className="select select-bordered select-sm w-40" value={theme} onChange={handleThemeChange}>
      {themes.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  )
}
