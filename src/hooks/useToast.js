import { useState, useCallback } from 'react'

let idCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++idCounter
    setToasts(p => [...p, { id, message, type, duration }])
  }, [])

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, remove }
}
