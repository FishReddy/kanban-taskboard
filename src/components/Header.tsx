import { Moon, Plus, Sun, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem('taskboard-theme', next)
    } catch {
      // Private browsing can block storage. The theme still applies for this visit.
    }
  }

  return { theme, toggle }
}

/** `onNewTask` is omitted until the board is usable, which disables the button. */
export function Header({ onNewTask }: { onNewTask?: () => void }) {
  const { theme, toggle } = useTheme()

  return (
    <header className="header">
      <div className="header__brand">
        <img className="header__logo" src="/favicon.svg" alt="" width={24} height={24} />
        <h1 className="header__title">Taskboard</h1>
      </div>

      <div className="header__actions">
        <span
          className="guest-badge"
          title="Your tasks are saved to a guest session tied to this browser."
        >
          <UserRound size={13} aria-hidden />
          Guest
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        </button>
        <button type="button" className="button button--primary" onClick={onNewTask} disabled={!onNewTask}>
          <Plus size={16} aria-hidden />
          New task
        </button>
      </div>
    </header>
  )
}
