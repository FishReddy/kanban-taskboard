import { useLayoutEffect, useRef } from 'react'

/**
 * Opens a native <dialog> as a modal on mount, which provides the focus trap,
 * Escape handling and top layer. A layout effect is used so the dialog is open
 * before any child's regular effect runs: showModal moves focus to the first
 * focusable element, so a child that focuses a field must do so afterwards.
 */
export function useModalDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return dialogRef
}
