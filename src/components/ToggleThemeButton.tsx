import React, { useEffect, useState, useRef } from 'react'
import './ToggleThemeButton.css'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme')
    if (stored) return stored
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  }
  return 'light'
}

export const ToggleThemeButton: React.FC = () => {
  const [theme, setTheme] = useState(getInitialTheme())
  const switchRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Keyboard accessibility for switch
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleTheme()
    }
  }

  return (
    <button
      ref={switchRef}
      className="toggle-theme-switch"
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      tabIndex={0}
      data-checked={theme === 'dark'}
      aria-label={theme === 'light' ? 'Switch to dart mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dart mode' : 'Switch to light mode'}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
    >
      <span className="toggle-theme-thumb">
        {theme === 'light' ? (
          <svg className="toggle-theme-icon" viewBox="0 0 24 24" fill="none" stroke="orange" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg className="toggle-theme-icon" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
        )}
      </span>
    </button>
  )
}
