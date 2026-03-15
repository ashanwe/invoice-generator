export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  if (!open) return null

  const btnStyle = {
    danger:  'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-white',
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
  }[variant] || 'bg-red-600 hover:bg-red-500 text-white'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        style={{ animation: 'scaleIn 0.15s ease both' }}>
        <div>
          <h3 className="text-white font-black text-base mb-1">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${btnStyle}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
