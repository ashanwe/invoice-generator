import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar    from '../components/Sidebar'
import NewInvoice from './NewInvoice'
import Invoices   from './Invoices'
import Profile    from './Profile'

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      {/* pt-14 on mobile to clear the fixed top bar, pb-16 to clear bottom nav */}
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0 pb-16 md:pb-0">
        <Routes>
          <Route index          element={<NewInvoice />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="profile"  element={<Profile />} />
          <Route path="*"        element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}