import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PACKS = [
  {
    id:       'pack_20',
    credits:  20,
    price:    4.99,
    label:    'Starter',
    desc:     'Great for freelancers',
    color:    'border-slate-700 hover:border-blue-500',
    badge:    null,
  },
  {
    id:       'pack_50',
    credits:  50,
    price:    9.99,
    label:    'Pro',
    desc:     'Most popular choice',
    color:    'border-blue-500 ring-2 ring-blue-500/30',
    badge:    '⭐ Popular',
  },
  {
    id:       'pack_100',
    credits:  100,
    price:    16.99,
    label:    'Business',
    desc:     'Best value per invoice',
    color:    'border-slate-700 hover:border-emerald-500',
    badge:    '💰 Best Value',
  },
]

export default function UpgradeModal({ onClose, currentCredits = 0 }) {
  const navigate          = useNavigate()
  const [selected, setSelected] = useState('pack_50')
  const [loading, setLoading]   = useState(false)

  const selectedPack = PACKS.find(p => p.id === selected)

  const handlePurchase = async () => {
    setLoading(true)
    // ── Payment integration goes here ──
    // e.g. Stripe: redirect to checkout session
    // e.g. PayPal: open PayPal window
    // For now show a coming soon alert
    alert(`Payment coming soon!\n\nYou selected: ${selectedPack.credits} credits for $${selectedPack.price}\n\nConnect Stripe or PayPal to enable payments.`)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md
        rounded-t-2xl sm:rounded-2xl shadow-2xl
        flex flex-col overflow-hidden">

        {/* Drag handle mobile */}
        <div className="sm:hidden w-10 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-black text-lg">Get more invoices</h2>
              <p className="text-slate-400 text-sm mt-1">
                You have <span className="text-amber-400 font-bold">{currentCredits} credit{currentCredits !== 1 ? 's' : ''}</span> remaining
              </p>
            </div>
            <button onClick={onClose}
              className="text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition text-lg">
              ✕
            </button>
          </div>

          {/* Credit bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${Math.min((currentCredits / 5) * 100, 100)}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs mt-1.5">{currentCredits} of 5 free credits used</p>
          </div>
        </div>

        {/* Packs */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Choose a pack</p>
          {PACKS.map(pack => (
            <button key={pack.id} onClick={() => setSelected(pack.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                selected === pack.id ? pack.color : 'border-slate-800 hover:border-slate-600'
              }`}>
              {/* Credits circle */}
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-none ${
                selected === pack.id ? 'bg-blue-600' : 'bg-slate-800'
              }`}>
                <span className="text-white font-black text-base leading-none">{pack.credits}</span>
                <span className="text-white/70 text-xs">credits</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{pack.label}</span>
                  {pack.badge && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {pack.badge}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{pack.desc}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  ${(pack.price / pack.credits).toFixed(2)} per invoice
                </p>
              </div>

              {/* Price */}
              <div className="text-right flex-none">
                <p className="text-white font-black text-lg">${pack.price}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button onClick={handlePurchase} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-600/20">
            {loading
              ? 'Processing...'
              : `Buy ${selectedPack?.credits} credits — $${selectedPack?.price}`
            }
          </button>
          <p className="text-center text-slate-600 text-xs">
            Secure payment · Credits never expire · No subscription
          </p>
        </div>

      </div>
    </div>
  )
}