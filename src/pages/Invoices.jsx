import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from '../templates/InvoicePDF'

const STATUS_COLORS = {
  draft: 'bg-slate-700 text-slate-300',
  sent:  'bg-blue-500/20 text-blue-300',
  paid:  'bg-emerald-500/20 text-emerald-300',
}

export default function Invoices() {
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchInvoices() }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    setDeleting(id)
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(p => p.filter(i => i.id !== id))
    setDeleting(null)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(p => p.map(i => i.id === id ? { ...i, status } : i))
  }

  // Build invoice object for PDF
  const buildInvoice = (inv) => ({
    invoiceNumber: inv.invoice_number,
    issueDate:     inv.issue_date,
    dueDate:       inv.due_date,
    logo:          inv.from_data?.logo || null,
    from:          inv.from_data || {},
    to:            inv.to_data   || {},
    items:         inv.items     || [],
    taxRate:       inv.tax_rate  || 0,
    notes:         inv.notes     || '',
    bank:          inv.from_data?.bank || {},
  })

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="text-slate-500 text-sm">Loading invoices...</div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Invoices</h1>
            <p className="text-slate-400 text-sm mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
          >+ New Invoice</button>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-slate-300 font-semibold">No invoices yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">Create your first invoice to get started</p>
            <button onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition">
              Create Invoice →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {invoices.map(inv => (
              <div key={inv.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-slate-700 transition">

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">{inv.invoice_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">
                    To: <span className="text-slate-300 font-medium">{inv.to_data?.name || '—'}</span>
                    {inv.due_date && <span className="ml-3">Due: {inv.due_date}</span>}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{fmt(inv.total_amount)}</p>
                  <p className="text-slate-500 text-xs">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>

                {/* Status changer */}
                <select
                  value={inv.status}
                  onChange={e => updateStatus(inv.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>

                {/* Download */}
                <PDFDownloadLink
                  document={<InvoicePDF invoice={buildInvoice(inv)} />}
                  fileName={`${inv.to_data?.name?.replace(/\s+/g, '_') || 'invoice'}_${inv.invoice_number}.pdf`}
                >
                  {({ loading: l }) => (
                    <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                      {l ? '...' : '⬇ PDF'}
                    </button>
                  )}
                </PDFDownloadLink>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(inv.id)}
                  disabled={deleting === inv.id}
                  className="text-slate-600 hover:text-red-400 transition text-lg px-1"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
