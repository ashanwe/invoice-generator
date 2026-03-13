import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-sm animate-pulse">A</div>
        <p className="text-gray-500 text-sm">Verifying access...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />

  return children
}
