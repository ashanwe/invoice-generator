import { useState, useEffect } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from '../templates/InvoicePDF'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { v4 as uuidv4 } from 'uuid'

const TABS = [
  { id: 'details', label: '1  Details', icon: '🏢' },
  { id: 'items',   label: '2  Items',   icon: '📦' },
  { id: 'payment', label: '3  Payment', icon: '🏦' },
]

const emptyForm = (profile) => ({
  invoiceNumber: `INV-${Date.now()}`,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  logo: profile?.logo_url || null,
  from: {
    name:    profile?.full_name || '',
    email:   profile?.email || '',
    address: profile?.address || '',
  },
  to: { name: '', email: '', address: '' },
  items: [{ id: uuidv4(), description: '', qty: 1, rate: 0 }],
  taxRate: 0,
  notes: '',
  bank: {
    bankName:      profile?.bank_name || '',
    accountName:   profile?.bank_account_name || '',
    accountNumber: profile?.bank_account_number || '',
    routingNumber: profile?.bank_routing || '',
  },
})

export default function NewInvoice() {
  const { user, profile }           = useAuth()
  const [form, setForm]             = useState(() => emptyForm(null))
  const [processedInvoice, setProcessed] = useState(null)
  const [isClient, setIsClient]     = useState(false)
  const [tab, setTab]               = useState('details')
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [saveDone, setSaveDone]     = useState(false)

  useEffect(() => setIsClient(true), [])

  // Pre-fill from profile once loaded
  useEffect(() => {
    if (profile) setForm(emptyForm(profile))
  }, [profile])

  // Items
  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { id: uuidv4(), description: '', qty: 1, rate: 0 }] }))
  const removeItem = (id) => setForm(p => ({ ...p, items: p.items.filter(i => i.id !== id) }))
  const updateItem = (id, field, value) => setForm(p => ({
    ...p, items: p.items.map(i => i.id === id ? { ...i, [field]: value } : i)
  }))

  // Totals
  const subtotal = form.items.reduce((s, i) => s + i.qty * i.rate, 0)
  const taxAmt   = subtotal * (form.taxRate / 100)
  const total    = subtotal + taxAmt
  const fmt      = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  // Validate
  const validate = () => {
    const e = {}
    if (!form.from.name.trim()) e.fromName = 'Required'
    if (!form.to.name.trim())   e.toName   = 'Required'
    if (form.items.every(i => !i.description.trim())) e.items = 'Add at least one item'
    setErrors(e)
    if (e.fromName || e.toName) setTab('details')
    else if (e.items) setTab('items')
    return Object.keys(e).length === 0
  }

  // Process
  const handleProcess = () => {
    if (!validate()) return
    setProcessed({
      ...form,
      items: form.items.map((i, idx) => ({
        ...i,
        description: i.description.trim() || `Item ${idx + 1}`
      }))
    })
  }

  // Save to Supabase
  const handleSave = async () => {
    if (!processedInvoice) return
    setSaving(true)
    const { error } = await supabase.from('invoices').insert({
      user_id:        user.id,
      invoice_number: processedInvoice.invoiceNumber,
      issue_date:     processedInvoice.issueDate || null,
      due_date:       processedInvoice.dueDate   || null,
      from_data:      { ...processedInvoice.from, logo: processedInvoice.logo, bank: processedInvoice.bank },
      to_data:        processedInvoice.to,
      items:          processedInvoice.items,
      tax_rate:       processedInvoice.taxRate,
      notes:          processedInvoice.notes,
      status:         'draft',
      total_amount:   total,
    })
    if (!error) {
      setSaveDone(true)
      setTimeout(() => setSaveDone(false), 3000)
    }
    setSaving(false)
  }

  // Print
  const handlePrint = () => {
    const iframe = document.querySelector('iframe')
    if (iframe) { iframe.contentWindow.focus(); iframe.contentWindow.print() }
  }

  const inp = (err) =>
    `w-full bg-slate-800 border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition ${err ? 'border-red-500' : 'border-slate-700'}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">

      {/* Top bar */}
      <div className="flex-none border-b border-slate-800 bg-slate-900 px-5 py-3 flex justify-between items-center">
        <h1 className="text-white font-bold text-sm">New Invoice</h1>
        {processedInvoice && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
              {saving ? 'Saving...' : saveDone ? '✓ Saved!' : '💾 Save'}
            </button>
            <PDFDownloadLink
              document={<InvoicePDF invoice={processedInvoice} />}
              fileName={`${processedInvoice.to.name.replace(/\s+/g, '_')}_${processedInvoice.invoiceNumber}.pdf`}
            >
              {({ loading: l }) => (
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
                  {l ? '...' : '⬇ Download'}
                </button>
              )}
            </PDFDownloadLink>
            <button onClick={handlePrint}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
              🖨 Print
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — Form */}
        <div className="w-[44%] flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden">

          {/* Tabs */}
          <div className="flex-none flex border-b border-slate-800">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                  tab === t.id
                    ? 'border-blue-500 text-blue-400 bg-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

            {/* ── TAB 1: Details ── */}
            {tab === 'details' && (
              <>
                {/* Invoice info row */}
                <div className="flex gap-3 items-start flex-none">
                  {/* Logo thumbnail */}
                  <div className="flex flex-col gap-1 flex-none">
                    <span className="text-xs font-semibold text-slate-500">Logo</span>
                    <div className="w-16 h-10 rounded-lg border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center">
                      {form.logo
                        ? <img src={form.logo} alt="logo" className="w-full h-full object-contain" />
                        : <span className="text-slate-600 text-xs">–</span>
                      }
                    </div>
                    <span className="text-slate-600 text-xs">From profile</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Invoice No.</label>
                      <input className={inp()} value={form.invoiceNumber}
                        onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Issue Date</label>
                        <input type="date" className={inp()} value={form.issueDate}
                          onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Due Date</label>
                        <input type="date" className={inp()} value={form.dueDate}
                          onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 flex-none" />

                {/* From / To */}
                <div className="flex gap-3 flex-1 overflow-hidden">
                  <div className="flex-1 flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex-none">From</p>
                    <input className={inp(errors.fromName)} placeholder="Your Name *"
                      value={form.from.name}
                      onChange={e => setForm(p => ({ ...p, from: { ...p.from, name: e.target.value } }))} />
                    {errors.fromName && <p className="text-red-400 text-xs -mt-1">{errors.fromName}</p>}
                    <input className={inp()} placeholder="Email"
                      value={form.from.email}
                      onChange={e => setForm(p => ({ ...p, from: { ...p.from, email: e.target.value } }))} />
                    <textarea className={`${inp()} flex-1 resize-none`} placeholder="Address"
                      value={form.from.address}
                      onChange={e => setForm(p => ({ ...p, from: { ...p.from, address: e.target.value } }))} />
                  </div>
                  <div className="w-px bg-slate-800 flex-none" />
                  <div className="flex-1 flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex-none">Bill To</p>
                    <input className={inp(errors.toName)} placeholder="Client Name *"
                      value={form.to.name}
                      onChange={e => setForm(p => ({ ...p, to: { ...p.to, name: e.target.value } }))} />
                    {errors.toName && <p className="text-red-400 text-xs -mt-1">{errors.toName}</p>}
                    <input className={inp()} placeholder="Email"
                      value={form.to.email}
                      onChange={e => setForm(p => ({ ...p, to: { ...p.to, email: e.target.value } }))} />
                    <textarea className={`${inp()} flex-1 resize-none`} placeholder="Address"
                      value={form.to.address}
                      onChange={e => setForm(p => ({ ...p, to: { ...p.to, address: e.target.value } }))} />
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 2: Items ── */}
            {tab === 'items' && (
              <>
                <div className="flex gap-2 px-1 flex-none">
                  <span className="flex-1 text-xs font-semibold text-slate-500">Description</span>
                  <span className="w-14 text-xs font-semibold text-slate-500 text-center">Qty</span>
                  <span className="w-20 text-xs font-semibold text-slate-500 text-center">Rate</span>
                  <span className="w-16 text-xs font-semibold text-slate-500 text-right">Amount</span>
                  <span className="w-5" />
                </div>
                {errors.items && <p className="text-red-400 text-xs flex-none">{errors.items}</p>}

                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {form.items.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center bg-slate-800 rounded-xl px-2 py-2">
                      <input className="flex-1 bg-transparent border-b border-slate-700 px-1 py-1 text-sm text-white outline-none focus:border-blue-500 placeholder-slate-600"
                        placeholder={`Item ${idx + 1}`}
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)} />
                      <input className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white text-center outline-none focus:ring-1 focus:ring-blue-500"
                        type="number" min="1" value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                      <input className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white text-right outline-none focus:ring-1 focus:ring-blue-500"
                        type="number" min="0" value={item.rate}
                        onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                      <span className="w-16 text-xs text-right text-slate-300 font-semibold">
                        {fmt(item.qty * item.rate)}
                      </span>
                      <button onClick={() => removeItem(item.id)}
                        className="w-5 text-slate-600 hover:text-red-400 transition text-base">✕</button>
                    </div>
                  ))}
                  <button onClick={addItem}
                    className="text-blue-400 text-xs font-bold hover:underline mt-1 text-left">
                    + Add Item
                  </button>
                </div>

                {/* Totals */}
                <div className="flex-none border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span className="text-slate-300 font-semibold">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>Tax</span>
                      <input className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white text-center outline-none focus:ring-1 focus:ring-blue-500"
                        type="number" min="0" placeholder="0" value={form.taxRate}
                        onChange={e => setForm(p => ({ ...p, taxRate: Number(e.target.value) }))} />
                      <span>%</span>
                    </div>
                    <span className="text-slate-300 font-semibold">{fmt(taxAmt)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-blue-400 border-t border-slate-800 pt-2">
                    <span>Total Due</span><span>{fmt(total)}</span>
                  </div>
                </div>

                <textarea className={`${inp()} resize-none flex-none`} rows={2}
                  placeholder="Message to client (e.g. Thank you for your business!)"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </>
            )}

            {/* ── TAB 3: Payment ── */}
            {tab === 'payment' && (
              <div className="flex flex-col gap-3 flex-1">
                <p className="text-xs text-slate-500 flex-none">Pre-filled from your profile. Edit for this invoice only.</p>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Bank Name</label>
                  <input className={inp()} value={form.bank?.bankName || ''}
                    onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, bankName: e.target.value } }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Account Name</label>
                  <input className={inp()} value={form.bank?.accountName || ''}
                    onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, accountName: e.target.value } }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Account Number</label>
                  <input className={inp()} value={form.bank?.accountNumber || ''}
                    onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, accountNumber: e.target.value } }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Routing / Sort Code</label>
                  <input className={inp()} value={form.bank?.routingNumber || ''}
                    onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, routingNumber: e.target.value } }))} />
                </div>
                {(form.bank?.bankName || form.bank?.accountNumber) && (
                  <div className="flex-1 bg-slate-800 rounded-xl p-4 mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Preview</p>
                    {form.bank.bankName      && <p className="text-xs text-slate-300">🏦 {form.bank.bankName}</p>}
                    {form.bank.accountName   && <p className="text-xs text-slate-300 mt-1">👤 {form.bank.accountName}</p>}
                    {form.bank.accountNumber && <p className="text-xs text-slate-300 mt-1">🔢 {form.bank.accountNumber}</p>}
                    {form.bank.routingNumber && <p className="text-xs text-slate-300 mt-1">🔀 {form.bank.routingNumber}</p>}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Process button */}
          <div className="flex-none border-t border-slate-800 bg-slate-900 px-4 py-3">
            <button onClick={handleProcess}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-600/20">
              ⚡ Process Invoice
            </button>
            {processedInvoice && (
              <p className="text-center text-emerald-400 text-xs mt-2 font-semibold">
                ✓ Ready — Save or Download above
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
          {!processedInvoice ? (
            <div className="text-center text-slate-600 select-none">
              <div className="text-6xl mb-4">📄</div>
              <p className="font-bold text-slate-500">Invoice preview</p>
              <p className="text-sm mt-1">Click <span className="text-blue-500 font-bold">⚡ Process Invoice</span></p>
            </div>
          ) : isClient ? (
            <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
              <InvoicePDF invoice={processedInvoice} />
            </PDFViewer>
          ) : (
            <p className="text-slate-500 text-sm">Loading preview...</p>
          )}
        </div>

      </div>
    </div>
  )
}
