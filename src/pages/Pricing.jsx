import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Launch date — change this to your actual launch date
const LAUNCH_DATE = new Date('2025-08-01T00:00:00')

function useCountdown(target) {
  const calc = () => {
    const diff = Math.max(0, target - Date.now())
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

export default function ComingSoon() {
  const navigate        = useNavigate()
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE)
  const [email, setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleNotify = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
      className="min-h-screen bg-slate-950 text-white overflow-hidden relative flex flex-col items-center justify-center px-4">

      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-[0.06] blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500 rounded-full opacity-[0.05] blur-3xl pointer-events-none"
        style={{ animation: 'pulse 4s ease-in-out infinite 1s' }} />

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.8) 2px, rgba(255,255,255,0.8) 4px)',
        }} />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-16"
          style={{ animation: 'fadeDown 0.6s ease both' }}>
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-sm">IV</div>
          <span className="text-white font-bold text-xl tracking-tight">InvoiceFlow</span>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 rounded-full px-4 py-1.5 text-blue-300 text-xs font-bold uppercase tracking-widest mb-8"
          style={{ animation: 'fadeDown 0.6s ease 0.1s both' }}>
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping inline-block" />
          Under Construction
        </div>

        {/* Headline */}
        <div style={{ animation: 'fadeDown 0.7s ease 0.2s both' }}>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
            Something
            <br />
            <span className="text-transparent"
              style={{
                WebkitTextStroke: '1px rgba(59,130,246,0.6)',
              }}>
              big
            </span>
            {' '}is
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #06b6d4, #3b82f6)', backgroundSize: '200%' }}>
              coming.
            </span>
          </h1>
          <p className="text-slate-500 text-base mt-5 max-w-md mx-auto leading-relaxed">
            We're putting the finishing touches on something that will change how you create and send invoices.
          </p>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-3 md:gap-5 mt-12 mb-12"
          style={{ animation: 'fadeUp 0.7s ease 0.35s both' }}>
          {[
            { value: days,    label: 'Days'    },
            { value: hours,   label: 'Hours'   },
            { value: minutes, label: 'Minutes' },
            { value: seconds, label: 'Seconds' },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex flex-col items-center">
              <div className="relative">
                {/* Card */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center justify-center"
                  style={{ boxShadow: '0 0 20px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                  <span className="text-2xl md:text-3xl font-black tabular-nums text-white"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    {String(value).padStart(2, '0')}
                  </span>
                </div>
                {/* Separator dot — not after last */}
                {i < 3 && (
                  <span className="absolute -right-2 md:-right-3 top-1/2 -translate-y-1/2 text-slate-600 text-lg font-black">:</span>
                )}
              </div>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-2">{label}</span>
            </div>
          ))}
        </div>

        {/* Email notify form */}
        <div style={{ animation: 'fadeUp 0.7s ease 0.5s both' }}>
          {!submitted ? (
            <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition whitespace-nowrap"
                style={{ boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}>
                Notify me
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-3 max-w-sm mx-auto">
              <span className="text-emerald-400 text-lg">✓</span>
              <p className="text-emerald-400 text-sm font-semibold">You're on the list! We'll notify you.</p>
            </div>
          )}
          <p className="text-slate-700 text-xs mt-3">Be the first to know when we launch. No spam.</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-12 max-w-xs mx-auto"
          style={{ animation: 'fadeUp 0.7s ease 0.6s both' }}>
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-700 text-xs font-bold uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Back to app */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center"
          style={{ animation: 'fadeUp 0.7s ease 0.65s both' }}>
          <button onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
            ← Back to home
          </button>
          <button onClick={() => navigate('/login')}
            className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
            Sign in
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
            Go to app →
          </button>
        </div>

      </div>

      {/* Corner version tag */}
      <div className="fixed bottom-4 right-4 text-slate-800 text-xs font-bold"
        style={{ fontFamily: "'DM Mono', monospace" }}>
        v2.0 — launching soon
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import { usePricingConfig } from '../hooks/usePricingConfig'
// import UpgradeModal from '../components/UpgradeModal'

// const BANNER_COLORS = {
//   blue:   'from-blue-600 to-cyan-600',
//   green:  'from-emerald-600 to-teal-600',
//   orange: 'from-orange-500 to-amber-500',
//   purple: 'from-purple-600 to-pink-600',
//   red:    'from-red-600 to-rose-500',
// }

// const PACK_STYLES = [
//   { color: 'border-slate-700', glow: '',                                        ctaStyle: 'bg-slate-700 hover:bg-slate-600 text-white',                                   icon: '🚀' },
//   { color: 'border-blue-500',  glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]', ctaStyle: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30',        icon: '⭐' },
//   { color: 'border-slate-700', glow: '',                                        ctaStyle: 'bg-slate-700 hover:bg-slate-600 text-white',                                   icon: '💼' },
// ]

// const MONTHS_LIST = [1, 2, 3, 6, 12]

// const FAQS = [
//   { q: 'Do credits expire?',                    a: 'Never. Credits you purchase stay in your account forever until you use them.' },
//   { q: 'What counts as one credit?',            a: 'Each invoice you save to your account uses one credit. Downloading a PDF without saving is always free.' },
//   { q: 'Can I switch from credits to monthly?', a: 'Yes. Any unused credits remain in your account even if you subscribe monthly.' },
//   { q: 'What payment methods are accepted?',    a: 'We accept all major credit cards, debit cards, and PayPal. Payment processing is coming soon.' },
//   { q: 'Can I get a refund?',                   a: 'Unused credit packs are refundable within 7 days of purchase. Monthly plans can be cancelled anytime.' },
// ]

// // ── Monthly plan picker sub-component ──────────────────────
// function MonthlyPlanPicker({ config, features, user, navigate }) {
//   const [months, setMonths] = useState(1)

//   const basePrice     = Number(config.monthly_base_price)
//   const firstDisc     = Number(config.first_month_discount) / 100
//   const bulkDiscounts = config.bulk_discounts || {}

//   const bulkDisc   = (bulkDiscounts[String(months)] || 0) / 100
//   const firstMonth = +(basePrice * (1 - firstDisc)).toFixed(2)
//   const remaining  = months - 1
//   const subtotal   = +(firstMonth + basePrice * remaining).toFixed(2)
//   const totalDue   = +(subtotal * (1 - bulkDisc)).toFixed(2)
//   const normalTotal = +(basePrice * months).toFixed(2)
//   const saving     = +(normalTotal - totalDue).toFixed(2)

//   const monthLabel = (m) => {
//     if (bulkDiscounts[String(m)]) return `Save ${bulkDiscounts[String(m)]}%`
//     return null
//   }

//   return (
//     <div className="w-full max-w-lg mx-auto mb-16">
//       <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-blue-500 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(59,130,246,0.12)]">

//         {/* Banner */}
//         <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)]">
//           <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-black px-4 py-2 rounded-xl text-center shadow-lg">
//             🎉 LIMITED OFFER — {config.first_month_discount}% off your first month
//           </div>
//         </div>

//         <div className="mt-4 text-center mb-6">
//           <div className="text-4xl mb-2">♾️</div>
//           <h2 className="text-2xl font-black text-white">Monthly Pro</h2>
//           <p className="text-slate-400 text-sm mt-1">Unlimited invoices · cancel anytime</p>
//         </div>

//         {/* Month picker */}
//         <div className="mb-6">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Choose duration</p>
//           <div className="grid grid-cols-5 gap-1.5">
//             {MONTHS_LIST.map(m => {
//               const badge = monthLabel(m)
//               return (
//                 <button key={m} onClick={() => setMonths(m)}
//                   className={`relative flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition text-center ${
//                     months === m
//                       ? 'border-blue-500 bg-blue-600/20 text-white'
//                       : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
//                   }`}>
//                   {badge && (
//                     <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
//                       {badge}
//                     </span>
//                   )}
//                   <span className="font-black text-sm leading-tight">{m}</span>
//                   <span className="text-[10px] opacity-70">mo</span>
//                 </button>
//               )
//             })}
//           </div>
//         </div>

//         {/* Price breakdown */}
//         <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col gap-2.5">
//           <div className="flex justify-between items-center text-sm">
//             <span className="text-slate-400">Monthly rate</span>
//             <span className="text-white font-bold">${basePrice}/mo</span>
//           </div>
//           <div className="flex justify-between items-center text-sm">
//             <span className="text-slate-400">First month <span className="text-emerald-400 font-semibold">({config.first_month_discount}% off)</span></span>
//             <div className="flex items-center gap-2">
//               <span className="text-slate-600 line-through text-xs">${basePrice}</span>
//               <span className="text-emerald-400 font-bold">${firstMonth}</span>
//             </div>
//           </div>
//           {remaining > 0 && (
//             <div className="flex justify-between items-center text-sm">
//               <span className="text-slate-400">Remaining {remaining} month{remaining > 1 ? 's' : ''}</span>
//               <span className="text-white font-bold">${(basePrice * remaining).toFixed(2)}</span>
//             </div>
//           )}
//           {bulkDisc > 0 && (
//             <>
//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-slate-400">Subtotal</span>
//                 <span className="text-slate-400">${subtotal}</span>
//               </div>
//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-slate-400">Bulk discount <span className="text-blue-400 font-semibold">({Math.round(bulkDisc * 100)}% off total)</span></span>
//                 <span className="text-blue-400 font-bold">− ${(subtotal - totalDue).toFixed(2)}</span>
//               </div>
//             </>
//           )}
//           <div className="h-px bg-slate-700" />
//           <div className="flex justify-between items-center">
//             <span className="text-white font-black">Total due today</span>
//             <div className="flex items-center gap-2">
//               {saving > 0 && (
//                 <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
//                   Save ${saving}
//                 </span>
//               )}
//               <span className="text-blue-400 font-black text-xl">${totalDue}</span>
//             </div>
//           </div>
//         </div>

//         {/* Features */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
//           {features.map((f, i) => (
//             <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
//               <div className="w-4 h-4 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-none">
//                 <span className="text-blue-400 text-[10px]">✓</span>
//               </div>
//               {f}
//             </div>
//           ))}
//         </div>

//         {/* CTA */}
//         <button
//           onClick={() => user
//             ? alert(`Coming soon!\n\nPlan: ${months} month${months > 1 ? 's' : ''}\nTotal: $${totalDue}\n\nConnect Stripe or PayPal to enable payments.`)
//             : navigate('/login?tab=signup')}
//           className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black py-4 rounded-xl text-sm transition shadow-lg shadow-blue-600/20">
//           {user
//             ? `Subscribe — $${totalDue} for ${months} month${months > 1 ? 's' : ''} →`
//             : 'Sign up to subscribe →'}
//         </button>
//         <p className="text-center text-slate-600 text-xs mt-3">
//           Cancel anytime · Secure checkout · Credits never expire
//         </p>
//       </div>
//     </div>
//   )
// }

// // ── Main Pricing page ───────────────────────────────────────
// export default function Pricing() {
//   const navigate               = useNavigate()
//   const { user, profile }      = useAuth()
//   const { config, loading }    = usePricingConfig()
//   const [showUpgrade, setShowUpgrade] = useState(false)
//   const [openFaq, setOpenFaq]  = useState(null)
//   const [billingTab, setBillingTab] = useState('credits')

//   const credits     = profile?.invoice_credits ?? Number(config.free_credits)
//   const packs       = config.credit_packs || []
//   const banner      = config.promo_banner || {}
//   const monthlyFeatures = [
//     'Unlimited invoices per month',
//     'PDF download',
//     'Payment details & bank info',
//     'Client billing info',
//     'Priority support',
//     'Advanced invoice tracking',
//     'Monthly usage resets',
//   ]

//   if (loading) return (
//     <div className="min-h-screen bg-slate-950 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-3">
//         <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//         <p className="text-slate-500 text-sm">Loading pricing...</p>
//       </div>
//     </div>
//   )

//   return (
//     <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

//       {/* Grid background */}
//       <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
//         style={{
//           backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
//           backgroundSize: '60px 60px'
//         }} />
//       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600 rounded-full opacity-[0.07] blur-3xl pointer-events-none" />

//       {/* ── PROMO BANNER ── */}
//       {banner.active && banner.text && (
//         <div className={`relative z-20 bg-gradient-to-r ${BANNER_COLORS[banner.color] || BANNER_COLORS.blue} text-white text-xs font-bold text-center py-2.5 px-4`}>
//           🎉 {banner.text}
//         </div>
//       )}

//       {/* ── NAV ── */}
//       <nav className="relative z-10 flex justify-between items-center px-4 sm:px-8 py-4 border-b border-slate-800/50">
//         <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
//           <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white text-sm">IV</div>
//           <span className="text-white font-bold text-lg tracking-tight">InvoiceFlow</span>
//         </button>
//         <div className="flex items-center gap-3">
//           {user ? (
//             <>
//               {credits > 0 && (
//                 <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
//                   ⚡ {credits} credits left
//                 </span>
//               )}
//               <button onClick={() => navigate('/dashboard')}
//                 className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
//                 Dashboard →
//               </button>
//             </>
//           ) : (
//             <>
//               <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white text-sm font-medium transition">Sign In</button>
//               <button onClick={() => navigate('/login?tab=signup')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">Get Started Free</button>
//             </>
//           )}
//         </div>
//       </nav>

//       <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 flex flex-col items-center">

//         {/* ── HERO ── */}
//         <div className="text-center mb-14">
//           <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold mb-6">
//             <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
//             Simple, honest pricing
//           </div>
//           <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
//             Pay only for what<br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">you actually use</span>
//           </h1>
//           <p className="text-slate-400 text-lg max-w-xl mx-auto">
//             Start free with {config.free_credits} invoices. Buy credit packs that never expire, or go unlimited with a monthly plan.
//           </p>
//         </div>

//         {/* ── CURRENT PLAN ── */}
//         {user && (
//           <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
//             <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl flex-none">👤</div>
//             <div className="flex-1">
//               <p className="text-white font-bold text-sm">Your current plan</p>
//               <p className="text-slate-400 text-xs mt-0.5">
//                 Free tier ·{' '}
//                 <span className={`font-semibold ${credits === 0 ? 'text-red-400' : credits <= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
//                   {credits} credit{credits !== 1 ? 's' : ''} remaining
//                 </span>
//               </p>
//               <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
//                 <div
//                   className={`h-full rounded-full transition-all ${credits === 0 ? 'bg-red-500' : credits <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
//                   style={{ width: `${Math.min((credits / Number(config.free_credits)) * 100, 100)}%` }}
//                 />
//               </div>
//             </div>
//             <button onClick={() => setShowUpgrade(true)}
//               className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-none border ${
//                 credits === 0
//                   ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
//                   : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20'
//               }`}>
//               {credits === 0 ? '⚠️ Out of credits — Upgrade' : '+ Get more credits'}
//             </button>
//           </div>
//         )}

//         {/* ── BILLING TABS ── */}
//         <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-10 gap-1">
//           <button onClick={() => setBillingTab('credits')}
//             className={`px-5 py-2 rounded-lg text-sm font-bold transition ${billingTab === 'credits' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>
//             Credit Packs
//           </button>
//           <button onClick={() => setBillingTab('monthly')}
//             className={`px-5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${billingTab === 'monthly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>
//             Monthly
//             <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
//               {config.first_month_discount}% off first month
//             </span>
//           </button>
//         </div>

//         {/* ── CREDIT PACKS ── */}
//         {billingTab === 'credits' && (
//           <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
//             {packs.map((pack, i) => {
//               const style = PACK_STYLES[i] || PACK_STYLES[0]
//               const perInvoice = (pack.price / pack.credits).toFixed(2)
//               return (
//                 <div key={pack.id}
//                   className={`relative bg-slate-900 border-2 rounded-2xl p-6 flex flex-col transition ${style.color} ${style.glow}`}>
//                   {pack.popular && (
//                     <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg shadow-blue-600/30 whitespace-nowrap">
//                       ⭐ Most Popular
//                     </div>
//                   )}
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-none ${pack.popular ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-800 border border-slate-700'}`}>
//                       {style.icon}
//                     </div>
//                     <div>
//                       <p className="text-white font-black">{pack.label}</p>
//                       <p className="text-slate-500 text-xs">{pack.desc}</p>
//                     </div>
//                   </div>
//                   <div className="mb-5">
//                     <div className="flex items-end gap-1">
//                       <span className="text-4xl font-black text-white">${pack.price}</span>
//                       <span className="text-slate-500 text-sm mb-1.5">one-time</span>
//                     </div>
//                     <div className="flex items-center gap-2 mt-1">
//                       <span className="text-2xl font-black text-blue-400">{pack.credits}</span>
//                       <span className="text-slate-400 text-sm">invoices · ${perInvoice} each</span>
//                     </div>
//                   </div>
//                   <div className="flex flex-col gap-2 mb-6 flex-1">
//                     {['PDF download', 'Payment details', 'Client billing info', 'Never expires', ...(pack.popular ? ['Priority support'] : [])].map((f, fi) => (
//                       <div key={fi} className="flex items-center gap-2 text-sm text-slate-300">
//                         <span className={`text-xs flex-none ${pack.popular ? 'text-blue-400' : 'text-emerald-400'}`}>✓</span>
//                         {f}
//                       </div>
//                     ))}
//                   </div>
//                   <button
//                     onClick={() => user ? setShowUpgrade(true) : navigate('/login?tab=signup')}
//                     className={`w-full py-3 rounded-xl font-bold text-sm transition ${style.ctaStyle}`}>
//                     {user ? `Buy ${pack.label} Pack` : 'Sign up to purchase'}
//                   </button>
//                 </div>
//               )
//             })}
//           </div>
//         )}

//         {/* ── MONTHLY PLAN ── */}
//         {billingTab === 'monthly' && (
//           <MonthlyPlanPicker
//             config={config}
//             features={monthlyFeatures}
//             user={user}
//             navigate={navigate}
//           />
//         )}

//         {/* ── FREE TIER CALLOUT ── */}
//         <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-16">
//           <div className="text-3xl">🎁</div>
//           <div className="flex-1">
//             <p className="text-white font-bold">Start completely free</p>
//             <p className="text-slate-400 text-sm mt-0.5">
//               Every new account gets <span className="text-white font-semibold">{config.free_credits} free invoice credits</span> — no credit card required.
//             </p>
//           </div>
//           {!user && (
//             <button onClick={() => navigate('/login?tab=signup')}
//               className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-xl text-sm font-black transition flex-none">
//               Get {config.free_credits} Free →
//             </button>
//           )}
//         </div>

//         {/* ── COMPARISON TABLE ── */}
//         <div className="w-full mb-16">
//           <h2 className="text-xl font-black text-center text-white mb-6">What's included</h2>
//           <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
//             <div className="grid grid-cols-4 text-xs font-bold text-slate-500 uppercase tracking-widest px-5 py-3 border-b border-slate-800">
//               <span className="col-span-1">Feature</span>
//               <span className="text-center">Free</span>
//               <span className="text-center text-blue-400">Credits</span>
//               <span className="text-center text-cyan-400">Monthly</span>
//             </div>
//             {[
//               ['Invoice creation', `${config.free_credits} total`, '✓', '♾️ Unlimited'],
//               ['PDF download',     '✓', '✓', '✓'],
//               ['Save to account',  '✓', '✓', '✓'],
//               ['Bank / payment info', '✓', '✓', '✓'],
//               ['Invoice tracking', '✓', '✓', '✓'],
//               ['Credits expire',   'Never', 'Never', 'Monthly reset'],
//               ['Priority support', '—', '—', '✓'],
//             ].map(([feature, free, creds, monthly], i) => (
//               <div key={i} className={`grid grid-cols-4 px-5 py-3.5 text-sm ${i % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
//                 <span className="text-slate-300 col-span-1">{feature}</span>
//                 <span className="text-center text-slate-400">{free}</span>
//                 <span className="text-center text-blue-400 font-semibold">{creds}</span>
//                 <span className="text-center text-cyan-400 font-semibold">{monthly}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── FAQ ── */}
//         <div className="w-full mb-16">
//           <h2 className="text-xl font-black text-center text-white mb-6">Frequently asked questions</h2>
//           <div className="flex flex-col gap-2">
//             {FAQS.map((faq, i) => (
//               <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
//                 <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
//                   className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/50 transition">
//                   <span className="text-white font-semibold text-sm">{faq.q}</span>
//                   <span className={`text-slate-500 text-lg transition-transform flex-none ml-3 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
//                 </button>
//                 {openFaq === i && (
//                   <div className="px-5 pb-4">
//                     <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         <p className="text-slate-500 text-sm text-center">
//           Questions? Email us at{' '}
//           <a href="mailto:hello@invoiceflow.com" className="text-blue-400 hover:underline">hello@invoiceflow.com</a>
//         </p>
//       </div>

//       {showUpgrade && (
//         <UpgradeModal onClose={() => setShowUpgrade(false)} currentCredits={credits} />
//       )}
//     </div>
//   )
// }