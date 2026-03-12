import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar    from '../components/Sidebar'
import NewInvoice from './NewInvoice'
import Invoices   from './Invoices'
import Profile    from './Profile'

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
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
