import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-hidden">

      {/* Grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white text-sm">IV</div>
          <span className="text-white font-bold text-lg tracking-tight">InvoiceFlow</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/pricing')}
            className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition"
          >Pricing</button>
          <button
            onClick={() => navigate('/login')}
            className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition"
          >Sign In</button>
          <button
            onClick={() => navigate('/login?tab=signup')}
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-500/25"
          >Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-10">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Professional Invoice Generator
        </div>

        <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
          Invoices that get<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            you paid faster
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Create beautiful PDF invoices in seconds. Save your profile, track clients, and manage everything in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={() => navigate('/login?tab=signup')}
            className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-xl font-bold text-base transition shadow-2xl shadow-blue-500/30 hover:shadow-blue-400/40"
          >
            Start for free →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-bold text-base transition backdrop-blur-sm"
          >
            Sign in
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            { icon: '⚡', title: 'Instant PDF', desc: 'Professional invoices generated in one click' },
            { icon: '💾', title: 'Cloud Saved', desc: 'All invoices stored securely in your account' },
            { icon: '🏢', title: 'Your Brand', desc: 'Logo, address and bank details saved to profile' },
          ].map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left backdrop-blur-sm hover:bg-white/8 transition">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-white font-bold text-sm mb-1">{f.title}</div>
              <div className="text-slate-400 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-slate-600 text-xs">
        © {new Date().getFullYear()} InvoiceFlow. Built with React + Supabase.
      </footer>
    </div>
  )
}