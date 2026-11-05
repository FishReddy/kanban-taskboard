import { CloudOff, RotateCw } from 'lucide-react'

interface ErrorStateProps {
  title: string
  message: string
  onRetry: () => void
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <main className="error-state" role="alert">
      <span className="error-state__icon">
        <CloudOff size={22} aria-hidden />
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        <RotateCw size={14} aria-hidden />
        Try again
      </button>
    </main>
  )
}
