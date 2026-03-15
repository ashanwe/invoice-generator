import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute   from './components/ProtectedRoute'
import AdminRoute       from './components/AdminRoute'
import Welcome          from './pages/Welcome'
import Login            from './pages/Login'
import Dashboard        from './pages/Dashboard'
import Admin            from './pages/Admin'
import Pricing          from './pages/Pricing'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"        element={<Welcome />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}