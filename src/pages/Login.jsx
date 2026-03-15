import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'signup' ? 'signup' : 'login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard')
    })
  }, [])

  const msg = (type, text) => setMessage({ type, text })

  const handleSubmit = async () => {
    if (!email || !password) return msg('error', 'Please enter your email and password.')
    setLoading(true)
    setMessage(null)

    if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })
      if (error) msg('error', error.message)
      else msg('confirm', `We've sent a confirmation email to ${email}. Please check your inbox and click the link to activate your account.`)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) msg('error', error.message)
      else navigate('/dashboard')
    }

    setLoading(false)
  }

  const inp = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">IV</div>
            <span className="text-white font-bold text-xl">InvoiceFlow</span>
          </button>
          <h2 className="text-2xl font-bold text-white">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {tab === 'login' ? 'Sign in to your account' : 'Start generating invoices for free'}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">

          {/* Sign In / Sign Up toggle */}
          <div className="flex bg-slate-900 rounded-xl p-1 mb-6">
            {['login', 'signup'].map(t => (
              <button key={t}
                onClick={() => { setTab(t); setMessage(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  tab === t ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}>
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-3">
            {tab === 'signup' && (
              <input
                className={inp}
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            )}
            <input
              className={inp}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <input
              className={inp}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Message */}
          {message && message.type === 'confirm' ? (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-3">📬</div>
              <p className="text-white font-bold text-sm mb-1">Check your inbox!</p>
              <p className="text-slate-400 text-xs leading-relaxed">{message.text}</p>
              <p className="text-slate-600 text-xs mt-3">Didn't receive it? Check your spam folder or{' '}
                <button onClick={handleSubmit} className="text-blue-400 hover:underline">resend</button>.
              </p>
            </div>
          ) : message ? (
            <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${
              message.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {message.text}
            </div>
          ) : null}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          {/* Forgot password */}
          {tab === 'login' && (
            <button
              onClick={async () => {
                if (!email) return msg('error', 'Enter your email first, then click Forgot Password.')
                setLoading(true)
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/dashboard`
                })
                if (error) msg('error', error.message)
                else msg('success', `Password reset email sent to ${email}`)
                setLoading(false)
              }}
              className="w-full mt-3 text-slate-500 hover:text-slate-300 text-xs transition"
            >
              Forgot password?
            </button>
          )}

        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>

      </div>
    </div>
  )
}