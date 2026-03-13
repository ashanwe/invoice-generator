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
]

const STATUS_COLORS = {
  draft: 'bg-slate-700/50 text-slate-300',
  sent:  'bg-blue-500/20 text-blue-300',
  paid:  'bg-emerald-500/20 text-emerald-300',
}

export default function Admin() {
  const { user, signOut }     = useAuth()
  const navigate              = useNavigate()
  const [tab, setTab]         = useState('overview')
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [search, setSearch]   = useState('')
  const [toast, setToast]     = useState(null)

  useEffect(() => { fetchAll() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [statsRes, usersRes, invoicesRes] = await Promise.all([
      supabase.rpc('get_admin_stats'),
      supabase.rpc('get_all_users'),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (statsRes.data)   setStats(statsRes.data)
    if (usersRes.data)   setUsers(usersRes.data || [])
    if (invoicesRes.data) setInvoices(invoicesRes.data || [])
    setLoading(false)
  }

  const handleDelete = async (u) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return
    setActionLoading(u.id + '_delete')
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: u.id })
    if (error) showToast(error.message, 'error')
    else { setUsers(p => p.filter(x => x.id !== u.id)); showToast(`${u.email} deleted.`) }
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
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-none">
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
                    ))}

                    {filtered.length === 0 && (
                      <div className="text-center py-16 text-gray-600 text-sm">
                        No users match "{search}"
                      </div>
                    )}
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