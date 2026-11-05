import { AlertCircle, X } from 'lucide-react'
import { useEffect } from 'react'

const TOAST_DURATION_MS = 6000

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className="toast" role="alert">
      <AlertCircle size={16} aria-hidden />
      <span>{message}</span>
      <button type="button" className="icon-button icon-button--small" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}
