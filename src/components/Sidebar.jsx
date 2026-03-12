import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/dashboard',          icon: '⚡', label: 'New Invoice' },
  { path: '/dashboard/invoices', icon: '📋', label: 'My Invoices' },
  { path: '/dashboard/profile',  icon: '👤', label: 'Profile' },
]

export default function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const avatar = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || '?'

  return (
    <aside className="w-56 flex-none bg-slate-900 border-r border-slate-800 flex flex-col h-screen">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs">IV</div>
          <span className="text-white font-bold text-base tracking-tight">InvoiceFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          {profile?.logo_url
            ? <img src={profile.logo_url} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
            : <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">{avatar}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{profile?.full_name || 'My Account'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
