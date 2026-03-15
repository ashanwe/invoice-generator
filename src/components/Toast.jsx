import { useEffect, useState } from 'react'

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}
const STYLES = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  error:   'bg-red-500/10 border-red-500/30 text-red-400',
  info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
}

export function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, remove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => remove(toast.id), 300)
    }, toast.duration || 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-semibold max-w-xs transition-all duration-300 ${STYLES[toast.type || 'success']} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
      <span className="text-base flex-none mt-0.5">{ICONS[toast.type || 'success']}</span>
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button onClick={() => { setVisible(false); setTimeout(() => remove(toast.id), 300) }}
        className="flex-none opacity-50 hover:opacity-100 transition text-base leading-none mt-0.5">✕</button>
    </div>
  )
}
