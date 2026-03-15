import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const fmt     = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users',    label: 'Users',    icon: '👥' },
  { id: 'pricing',  label: 'Pricing',  icon: '💳' },
]

const STATUS_COLORS = {
  draft: 'bg-slate-700/50 text-slate-300',
  sent:  'bg-blue-500/20 text-blue-300',
  paid:  'bg-emerald-500/20 text-emerald-300',
}

export default function Admin() {
  const { user, signOut, profile, refreshProfile } = useAuth()
  const navigate              = useNavigate()
  const [tab, setTab]         = useState('overview')
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [search, setSearch]   = useState('')
  const [toast, setToast]     = useState(null)
  const [pricingConfig, setPricingConfig] = useState(null)
  const [saving, setSaving] = useState({}) // { banner: bool, freeCredits: bool, monthly: bool, discounts: bool, packs: bool }

  useEffect(() => { fetchAll() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [statsRes, usersRes, invoicesRes, pricingRes] = await Promise.all([
      supabase.rpc('get_admin_stats'),
      supabase.rpc('get_all_users'),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('pricing_config').select('key, value'),
    ])
    if (statsRes.data)    setStats(statsRes.data)
    // get_all_users returns a JSON array directly as .data
    if (usersRes.data)    setUsers(Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data || []))
    if (invoicesRes.data) setInvoices(invoicesRes.data || [])
    if (pricingRes.data) {
      const parsed = {}
      pricingRes.data.forEach(row => { parsed[row.key] = row.value })
      setPricingConfig(parsed)
    }
    setLoading(false)
  }

  const savePricingField = async (key, value, section) => {
    setSaving(p => ({ ...p, [section]: true }))
    const { error } = await supabase.rpc('admin_update_pricing_config', {
      config_key: key,
      config_value: typeof value === 'object' ? value : JSON.parse(JSON.stringify(value)),
    })
    if (error) showToast(error.message, 'error')
    else {
      setPricingConfig(p => ({ ...p, [key]: value }))
      showToast('Saved!')
    }
    setSaving(p => ({ ...p, [section]: false }))
  }

  const handleDelete = async (u) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return
    setActionLoading(u.id + '_delete')
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: u.id })
    if (error) showToast(error.message, 'error')
    else { setUsers(p => p.filter(x => x.id !== u.id)); showToast(`${u.email} deleted.`) }
    setActionLoading(null)
  }

  const [creditInputs, setCreditInputs] = useState({}) // { userId: value }

  const handleGrantCredits = async (u, amount) => {
    setActionLoading(u.id + '_credits')
    const { error } = await supabase.rpc('admin_grant_credits', {
      target_user_id: u.id,
      credit_amount: amount
    })
    if (error) showToast(error.message, 'error')
    else {
      setUsers(p => p.map(x => x.id === u.id
        ? { ...x, invoice_credits: (x.invoice_credits || 0) + amount }
        : x
      ))
      showToast(`+${amount} credits granted to ${u.email}`)
      if (u.id === user?.id) refreshProfile()
    }
    setActionLoading(null)
  }

  const handleSetCredits = async (u) => {
    const val = parseInt(creditInputs[u.id])
    if (isNaN(val) || val < 0) return showToast('Enter a valid number', 'error')
    setActionLoading(u.id + '_credits')
    const { error } = await supabase.rpc('admin_set_credits', {
      target_user_id: u.id,
      credit_amount: val
    })
    if (error) showToast(error.message, 'error')
    else {
      setUsers(p => p.map(x => x.id === u.id ? { ...x, invoice_credits: val } : x))
      setCreditInputs(p => ({ ...p, [u.id]: '' }))
      showToast(`Credits set to ${val} for ${u.email}`)
      if (u.id === user?.id) refreshProfile()
    }
    setActionLoading(null)
  }

  const handleConfirm = async (u) => {
    setActionLoading(u.id + '_confirm')
    const { error } = await supabase.rpc('admin_confirm_user', { target_user_id: u.id })
    if (error) showToast(error.message, 'error')
    else {
      setUsers(p => p.map(x => x.id === u.id ? { ...x, email_confirmed_at: new Date().toISOString() } : x))
      showToast(`${u.email} confirmed.`)
    }
    setActionLoading(null)
  }

  // Top 5 users by revenue
  const topUsers = [...users].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0)).slice(0, 5)

  // Recent 8 invoices
  const recentInvoices = invoices.slice(0, 8)

  // Invoice status breakdown
  const statusBreakdown = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1
    return acc
  }, {})

  // Avg invoice value
  const avgInvoice = invoices.length > 0
    ? invoices.reduce((s, i) => s + (i.total_amount || 0), 0) / invoices.length
    : 0

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-3 flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-xs">A</div>
          <div>
            <span className="text-white font-bold text-sm">Admin Panel</span>
            <span className="text-gray-500 text-xs ml-2">InvoiceFlow</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs hidden sm:block">{user?.email}</span>
          <button onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-xs border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition">
            ← App
          </button>
          <button onClick={async () => { await signOut(); navigate('/') }}
            className="text-red-400 hover:text-red-300 text-xs border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition">
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-gray-800 bg-gray-900">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition ${
              tab === t.id ? 'border-red-500 text-red-400' : 'border-transparent text-gray-500'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="hidden md:flex w-48 flex-none bg-gray-900 border-r border-gray-800 flex flex-col py-4 px-3">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition text-left ${
                tab === t.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
          <button onClick={fetchAll}
            className="mt-auto flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-300 text-xs transition">
            🔄 Refresh
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
              Loading admin data...
            </div>
          ) : (
            <>

              {/* ══════════════════════════════
                   OVERVIEW TAB
              ══════════════════════════════ */}
              {tab === 'overview' && (
                <div className="flex flex-col gap-6">

                  {/* Header */}
                  <div>
                    <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">
                      All platform activity · Last updated {new Date().toLocaleTimeString()}
                    </p>
                  </div>

                  {/* ── Row 1: Main stat cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Users',     value: stats?.total_users || 0,             icon: '👥', sub: `+${stats?.new_users_this_month || 0} this month`,  subColor: 'text-emerald-400' },
                      { label: 'Total Invoices',  value: stats?.total_invoices || 0,           icon: '📄', sub: `${invoices.filter(i => i.status === 'paid').length} paid`,      subColor: 'text-blue-400' },
                      { label: 'Active Users',    value: stats?.active_users_this_month || 0,  icon: '⚡', sub: 'invoiced this month',                               subColor: 'text-amber-400' },
                      { label: 'Avg Invoice',     value: fmt(avgInvoice),                      icon: '📈', sub: `across ${invoices.length} invoices`,               subColor: 'text-violet-400' },
                    ].map(card => (
                      <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{card.label}</span>
                          <span className="text-lg">{card.icon}</span>
                        </div>
                        <div className="text-2xl font-black text-white mb-1">{card.value}</div>
                        <div className={`text-xs font-medium ${card.subColor}`}>{card.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Row 2: Total Revenue (wide) + Status breakdown ── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Total Revenue */}
                    <div className="col-span-1 md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Total Revenue</p>
                          <p className="text-4xl font-black text-white">{fmt(stats?.total_revenue)}</p>
                        </div>
                        <span className="text-3xl">💰</span>
                      </div>
                      {/* Revenue bar — paid vs pending */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>Paid</span>
                          <span>Pending / Draft</span>
                        </div>
                        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                          {(() => {
                            const paid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
                            const total   = invoices.reduce((s, i) => s + (i.total_amount || 0), 0)
                            const pct     = total > 0 ? (paid / total) * 100 : 0
                            return (
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }} />
                            )
                          })()}
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-emerald-400 font-semibold">
                            {fmt(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0))}
                          </span>
                          <span className="text-gray-500">
                            {fmt(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_amount || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Status Breakdown */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">Invoice Status</p>
                      <div className="flex flex-col gap-3">
                        {[
                          { status: 'paid',  label: 'Paid',    color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                          { status: 'sent',  label: 'Sent',    color: 'bg-blue-500',    textColor: 'text-blue-400' },
                          { status: 'draft', label: 'Draft',   color: 'bg-gray-500',    textColor: 'text-gray-400' },
                        ].map(s => {
                          const count = statusBreakdown[s.status] || 0
                          const pct   = invoices.length > 0 ? (count / invoices.length) * 100 : 0
                          return (
                            <div key={s.status}>
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className={`font-semibold ${s.textColor}`}>{s.label}</span>
                                <span className="text-gray-400">{count} ({Math.round(pct)}%)</span>
                              </div>
                              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Total count */}
                      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-xs">
                        <span className="text-gray-500">Total invoices</span>
                        <span className="text-white font-bold">{invoices.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Row 3: Top Users + Recent Invoices ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Top Users by Revenue */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white font-bold text-sm">Top Users by Revenue</h2>
                        <button onClick={() => setTab('users')} className="text-xs text-gray-500 hover:text-white transition">
                          View all →
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {topUsers.length === 0 && (
                          <p className="text-gray-600 text-xs text-center py-6">No invoices yet</p>
                        )}
                        {topUsers.map((u, i) => (
                          <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-none ${
                              i === 0 ? 'bg-amber-500 text-black' :
                              i === 1 ? 'bg-gray-400 text-black' :
                              i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'
                            }`}>{i + 1}</div>
                            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 text-xs font-bold flex-none">
                              {u.email?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-semibold truncate">{u.full_name || u.email}</p>
                              <p className="text-gray-600 text-xs">{u.invoice_count} invoices</p>
                            </div>
                            <span className="text-emerald-400 text-xs font-bold flex-none">{fmt(u.total_revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Invoices */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white font-bold text-sm">Recent Invoices</h2>
                        <span className="text-gray-600 text-xs">Last {recentInvoices.length}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {recentInvoices.length === 0 && (
                          <p className="text-gray-600 text-xs text-center py-6">No invoices yet</p>
                        )}
                        {recentInvoices.map(inv => (
                          <div key={inv.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white text-xs font-semibold">{inv.invoice_number}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>
                                  {inv.status}
                                </span>
                              </div>
                              <p className="text-gray-600 text-xs truncate">
                                → {inv.to_data?.name || '—'} · {fmtDate(inv.created_at)}
                              </p>
                            </div>
                            <span className="text-white text-xs font-bold flex-none">{fmt(inv.total_amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Row 4: Recent Signups ── */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-white font-bold text-sm">Recent Signups</h2>
                      <button onClick={() => setTab('users')} className="text-xs text-gray-500 hover:text-white transition">
                        Manage users →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {users.slice(0, 6).map(u => (
                        <div key={u.id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-gray-300 text-sm font-bold flex-none">
                            {u.email?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{u.full_name || '—'}</p>
                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                            <p className="text-gray-700 text-xs">{fmtDate(u.created_at)}</p>
                          </div>
                          {!u.email_confirmed_at && (
                            <span className="text-amber-400 text-xs flex-none">⚠</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ══════════════════════════════
                   USERS TAB
              ══════════════════════════════ */}
              {tab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-xl font-bold text-white">Users</h1>
                      <p className="text-gray-500 text-sm mt-1">{users.length} total accounts</p>
                    </div>
                    <input
                      className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 transition w-56"
                      placeholder="Search name or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[
                      { label: 'Total',       value: users.length,                                          color: 'text-white' },
                      { label: 'Confirmed',   value: users.filter(u => u.email_confirmed_at).length,        color: 'text-emerald-400' },
                      { label: 'Unconfirmed', value: users.filter(u => !u.email_confirmed_at).length,       color: 'text-amber-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-500 text-xs">{s.label}</span>
                        <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    {filtered.map(u => (
                      <div key={u.id}
                        className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 flex items-center gap-4 transition">

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300 text-sm font-bold flex-none">
                          {u.email?.[0]?.toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-white text-sm font-semibold truncate">{u.full_name || '—'}</span>
                            {u.is_admin && (
                              <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                            )}
                            {!u.email_confirmed_at && (
                              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">Unconfirmed</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs truncate">{u.email}</p>
                          <p className="text-gray-600 text-xs mt-0.5">
                            Joined {fmtDate(u.created_at)} · Last seen {fmtTime(u.last_sign_in_at)}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="text-right flex-none">
                          <p className="text-white text-sm font-bold">{fmt(u.total_revenue)}</p>
                          <p className="text-gray-500 text-xs">{u.invoice_count} invoice{u.invoice_count !== 1 ? 's' : ''}</p>
                          <p className="text-amber-400 text-xs font-semibold mt-0.5">
                            {u.is_admin ? '👑 Unlimited' : `⚡ ${u.invoice_credits ?? 5} credits`}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 flex-none">
                          {/* Credits control */}
                          <div className="flex items-center gap-1">
                            <input
                              type="number" min="0"
                              placeholder={u.is_admin ? '∞' : String(u.invoice_credits ?? 5)}
                              value={creditInputs[u.id] || ''}
                              onChange={e => setCreditInputs(p => ({ ...p, [u.id]: e.target.value }))}
                              disabled={u.is_admin}
                              className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                            <button
                              onClick={() => handleSetCredits(u)}
                              disabled={actionLoading === u.id + '_credits' || !creditInputs[u.id] || u.is_admin}
                              title="Set credits to this value"
                              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 px-2 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40">
                              Set
                            </button>
                            <button
                              onClick={() => handleGrantCredits(u, parseInt(creditInputs[u.id] || 0))}
                              disabled={actionLoading === u.id + '_credits' || !creditInputs[u.id] || u.is_admin}
                              title="Add this amount to current credits"
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-2 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40">
                              +Add
                            </button>
                          </div>
                          {/* Confirm + Delete */}
                          <div className="flex gap-1.5">
                            {!u.email_confirmed_at && (
                              <button onClick={() => handleConfirm(u)} disabled={actionLoading === u.id + '_confirm'}
                                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40">
                                {actionLoading === u.id + '_confirm' ? '...' : '✓ Confirm'}
                              </button>
                            )}
                            {!u.is_admin && (
                              <button onClick={() => handleDelete(u)} disabled={actionLoading === u.id + '_delete'}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40">
                                {actionLoading === u.id + '_delete' ? '...' : '🗑 Delete'}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}

                    {filtered.length === 0 && (
                      <div className="text-center py-16 text-gray-600 text-sm">
                        No users match "{search}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PRICING TAB ── */}
              {tab === 'pricing' && pricingConfig && (
                <div className="flex flex-col gap-6">

                  {/* ── ROW 1: Banner (full width) ── */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-black text-base flex items-center gap-2">🎉 Promo Banner</h3>
                      {/* Live preview */}
                      {pricingConfig.promo_banner?.active && pricingConfig.promo_banner?.text && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">● Live</span>
                      )}
                    </div>

                    {/* Banner preview strip */}
                    <div className={`rounded-xl py-2.5 px-4 text-center text-xs font-bold text-white mb-5 bg-gradient-to-r ${
                      {'blue':'from-blue-600 to-cyan-600','green':'from-emerald-600 to-teal-600','orange':'from-orange-500 to-amber-500','purple':'from-purple-600 to-pink-600','red':'from-red-600 to-rose-500'}[pricingConfig.promo_banner?.color] || 'from-blue-600 to-cyan-600'
                    } ${!pricingConfig.promo_banner?.text ? 'opacity-30' : ''}`}>
                      🎉 {pricingConfig.promo_banner?.text || 'Your banner text will appear here...'}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Toggle */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 font-semibold">Status</label>
                        <button
                          onClick={() => setPricingConfig(p => ({ ...p, promo_banner: { ...p.promo_banner, active: !p.promo_banner?.active } }))}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${pricingConfig.promo_banner?.active ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-800'}`}>
                          <div className={`w-11 h-6 rounded-full relative transition-colors flex-none ${pricingConfig.promo_banner?.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${pricingConfig.promo_banner?.active ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <span className={`text-sm font-bold ${pricingConfig.promo_banner?.active ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {pricingConfig.promo_banner?.active ? 'Showing' : 'Hidden'}
                          </span>
                        </button>
                      </div>

                      {/* Text */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 font-semibold">Banner Text</label>
                        <input
                          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 h-full"
                          placeholder="Summer sale — 20% off all plans!"
                          value={pricingConfig.promo_banner?.text || ''}
                          onChange={e => setPricingConfig(p => ({ ...p, promo_banner: { ...p.promo_banner, text: e.target.value } }))}
                        />
                      </div>

                      {/* Color + Save */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 font-semibold">Color</label>
                        <div className="flex gap-2 mb-2">
                          {[
                            { id: 'blue',   bg: 'bg-blue-600'    },
                            { id: 'green',  bg: 'bg-emerald-600' },
                            { id: 'orange', bg: 'bg-orange-500'  },
                            { id: 'purple', bg: 'bg-purple-600'  },
                            { id: 'red',    bg: 'bg-red-600'     },
                          ].map(c => (
                            <button key={c.id}
                              onClick={() => setPricingConfig(p => ({ ...p, promo_banner: { ...p.promo_banner, color: c.id } }))}
                              className={`w-9 h-9 rounded-lg border-2 transition ${c.bg} ${pricingConfig.promo_banner?.color === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                          ))}
                        </div>
                        <button
                          onClick={() => savePricingField('promo_banner', pricingConfig.promo_banner, 'banner')}
                          disabled={saving.banner}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition">
                          {saving.banner ? 'Saving...' : '💾 Save Banner'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── ROW 2: Free Credits + Monthly base ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Free Credits */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
                      <h3 className="text-white font-black text-base flex items-center gap-2">🎁 Free Credits for New Users</h3>
                      <p className="text-gray-500 text-sm -mt-2">Applies to every new account at signup. Existing users are not affected.</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="relative">
                          <input
                            type="number" min="0" max="1000"
                            className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-2xl font-black text-white text-center outline-none focus:ring-2 focus:ring-blue-500"
                            value={pricingConfig.free_credits ?? 5}
                            onChange={e => setPricingConfig(p => ({ ...p, free_credits: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">credits</p>
                          <p className="text-gray-500 text-xs">per new account</p>
                        </div>
                      </div>
                      <button
                        onClick={() => savePricingField('free_credits', pricingConfig.free_credits, 'freeCredits')}
                        disabled={saving.freeCredits}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition self-start mt-auto">
                        {saving.freeCredits ? 'Saving...' : '💾 Save'}
                      </button>
                    </div>

                    {/* Monthly Base Price */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
                      <h3 className="text-white font-black text-base flex items-center gap-2">♾️ Monthly Plan Base Price</h3>
                      <p className="text-gray-500 text-sm -mt-2">The standard monthly rate before any discounts are applied.</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-black text-gray-400">$</span>
                        <input type="number" min="0" step="0.01"
                          className="w-32 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-blue-500"
                          value={pricingConfig.monthly_base_price ?? 12.99}
                          onChange={e => setPricingConfig(p => ({ ...p, monthly_base_price: Number(e.target.value) }))}
                        />
                        <span className="text-gray-500 text-sm">/ month</span>
                      </div>
                      <button
                        onClick={() => savePricingField('monthly_base_price', pricingConfig.monthly_base_price, 'monthly')}
                        disabled={saving.monthly}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition self-start mt-auto">
                        {saving.monthly ? 'Saving...' : '💾 Save'}
                      </button>
                    </div>
                  </div>

                  {/* ── ROW 3: Discounts (full width, side by side) ── */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-white font-black text-base mb-1">🏷️ Discounts</h3>
                    <p className="text-gray-500 text-sm mb-6">First-month promo applies to all plans. Bulk discounts apply to the full total for longer durations.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* First month discount */}
                      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          <div>
                            <p className="text-white font-bold text-sm">First Month</p>
                            <p className="text-gray-500 text-xs">Applies to all plans</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100"
                            className="w-20 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xl font-black text-white text-center outline-none focus:ring-2 focus:ring-blue-500"
                            value={pricingConfig.first_month_discount ?? 40}
                            onChange={e => setPricingConfig(p => ({ ...p, first_month_discount: Number(e.target.value) }))}
                          />
                          <span className="text-gray-400 text-lg font-bold">%</span>
                          <span className="text-gray-500 text-xs">off first month</span>
                        </div>
                      </div>

                      {/* 6 month bulk */}
                      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📦</span>
                          <div>
                            <p className="text-white font-bold text-sm">6 Month Bulk</p>
                            <p className="text-gray-500 text-xs">Off total price</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100"
                            className="w-20 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xl font-black text-white text-center outline-none focus:ring-2 focus:ring-blue-500"
                            value={pricingConfig.bulk_discounts?.['6'] ?? 20}
                            onChange={e => setPricingConfig(p => ({ ...p, bulk_discounts: { ...p.bulk_discounts, '6': Number(e.target.value) } }))}
                          />
                          <span className="text-gray-400 text-lg font-bold">%</span>
                          <span className="text-gray-500 text-xs">off 6-month total</span>
                        </div>
                      </div>

                      {/* 12 month bulk */}
                      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏆</span>
                          <div>
                            <p className="text-white font-bold text-sm">12 Month Bulk</p>
                            <p className="text-gray-500 text-xs">Off total price</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100"
                            className="w-20 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xl font-black text-white text-center outline-none focus:ring-2 focus:ring-blue-500"
                            value={pricingConfig.bulk_discounts?.['12'] ?? 30}
                            onChange={e => setPricingConfig(p => ({ ...p, bulk_discounts: { ...p.bulk_discounts, '12': Number(e.target.value) } }))}
                          />
                          <span className="text-gray-400 text-lg font-bold">%</span>
                          <span className="text-gray-500 text-xs">off 12-month total</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        await Promise.all([
                          savePricingField('first_month_discount', pricingConfig.first_month_discount, 'discounts'),
                          savePricingField('bulk_discounts', pricingConfig.bulk_discounts, 'discounts'),
                        ])
                      }}
                      disabled={saving.discounts}
                      className="mt-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition">
                      {saving.discounts ? 'Saving...' : '💾 Save All Discounts'}
                    </button>
                  </div>

                  {/* ── ROW 4: Credit Packs (3 columns) ── */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-white font-black text-base mb-1">📦 Credit Packs</h3>
                    <p className="text-gray-500 text-sm mb-6">Edit the one-time credit pack options shown on the pricing page.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {(pricingConfig.credit_packs || []).map((pack, i) => (
                        <div key={pack.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
                          {/* Pack header */}
                          <div className="flex items-center justify-between">
                            <span className="text-white font-black">{pack.label}</span>
                            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                              <input type="checkbox" checked={pack.popular}
                                onChange={e => setPricingConfig(p => ({
                                  ...p,
                                  credit_packs: p.credit_packs.map((pk, idx) =>
                                    idx === i ? { ...pk, popular: e.target.checked } : { ...pk, popular: false }
                                  )
                                }))}
                                className="accent-blue-500 w-3.5 h-3.5"
                              />
                              Popular
                            </label>
                          </div>

                          {/* Fields */}
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-semibold mb-1 block">Label</label>
                              <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                value={pack.label}
                                onChange={e => setPricingConfig(p => ({ ...p, credit_packs: p.credit_packs.map((pk, idx) => idx === i ? { ...pk, label: e.target.value } : pk) }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold mb-1 block">Description</label>
                              <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                value={pack.desc}
                                onChange={e => setPricingConfig(p => ({ ...p, credit_packs: p.credit_packs.map((pk, idx) => idx === i ? { ...pk, desc: e.target.value } : pk) }))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 font-semibold mb-1 block">Credits</label>
                                <input type="number" min="1"
                                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center outline-none focus:ring-1 focus:ring-blue-500"
                                  value={pack.credits}
                                  onChange={e => setPricingConfig(p => ({ ...p, credit_packs: p.credit_packs.map((pk, idx) => idx === i ? { ...pk, credits: Number(e.target.value) } : pk) }))}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 font-semibold mb-1 block">Price ($)</label>
                                <input type="number" min="0" step="0.01"
                                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                  value={pack.price}
                                  onChange={e => setPricingConfig(p => ({ ...p, credit_packs: p.credit_packs.map((pk, idx) => idx === i ? { ...pk, price: Number(e.target.value) } : pk) }))}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Per invoice calc */}
                          <div className="bg-gray-900 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Per invoice</span>
                            <span className="text-blue-400 font-bold text-sm">${pack.credits > 0 ? (pack.price / pack.credits).toFixed(2) : '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => savePricingField('credit_packs', pricingConfig.credit_packs, 'packs')}
                      disabled={saving.packs}
                      className="mt-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition">
                      {saving.packs ? 'Saving...' : '💾 Save Credit Packs'}
                    </button>
                  </div>

                </div>
              )}

            </>
          )}
        </main>
      </div>
    </div>
  )
}