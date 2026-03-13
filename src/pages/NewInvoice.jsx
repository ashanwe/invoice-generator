import { useState, useEffect, useRef } from 'react'
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
  const { user, profile }                = useAuth()
  const [form, setForm]                  = useState(() => emptyForm(null))
  const [processedInvoice, setProcessed] = useState(null)
  const [isClient, setIsClient]          = useState(false)
  const [tab, setTab]                    = useState('details')
  const [errors, setErrors]              = useState({})
  const [saving, setSaving]              = useState(false)
  const [saveDone, setSaveDone]          = useState(false)
  const [showPreview, setShowPreview]    = useState(false)
  const profileFilled                    = useRef(false)

  useEffect(() => setIsClient(true), [])

  useEffect(() => {
    if (profile && !profileFilled.current) {
      profileFilled.current = true
      setForm(emptyForm(profile))
    }
  }, [profile])

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { id: uuidv4(), description: '', qty: 1, rate: 0 }] }))
  const removeItem = (id) => setForm(p => ({ ...p, items: p.items.filter(i => i.id !== id) }))
  const updateItem = (id, field, value) => setForm(p => ({
    ...p, items: p.items.map(i => i.id === id ? { ...i, [field]: value } : i)
  }))

  const subtotal = form.items.reduce((s, i) => s + i.qty * i.rate, 0)
  const taxAmt   = subtotal * (form.taxRate / 100)
  const total    = subtotal + taxAmt
  const fmt      = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

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

  const handleProcess = () => {
    if (!validate()) return
    setProcessed({
      ...form,
      items: form.items.map((i, idx) => ({
        ...i, description: i.description.trim() || `Item ${idx + 1}`
      }))
    })
  }

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
    if (!error) { setSaveDone(true); setTimeout(() => setSaveDone(false), 3000) }
    setSaving(false)
  }

  const handlePrint = () => {
    const iframe = document.querySelector('iframe')
    if (iframe) { iframe.contentWindow.focus(); iframe.contentWindow.print() }
  }

  const inp = (err) =>
    `w-full bg-slate-800 border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition ${err ? 'border-red-500' : 'border-slate-700'}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">

      {/* Top bar */}
      <div className="flex-none border-b border-slate-800 bg-slate-900 px-4 py-3 flex justify-between items-center gap-2">
        <h1 className="text-white font-bold text-sm flex-none">New Invoice</h1>
        {processedInvoice && (
          <div className="flex gap-2 flex-wrap justify-end">
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
                  {l ? '...' : '⬇ PDF'}
                </button>
              )}
            </PDFDownloadLink>
            {/* Preview toggle — mobile only */}
            <button onClick={() => setShowPreview(p => !p)}
              className="md:hidden bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
              {showPreview ? '✏️ Edit' : '👁 Preview'}
            </button>
            {/* Print — desktop only */}
            <button onClick={handlePrint}
              className="hidden md:block bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
              🖨 Print
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── FORM — full width on mobile, 44% on desktop ── */}
        <div className={`flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden
          ${showPreview ? 'hidden' : 'flex'}
          w-full md:w-[44%] md:flex`}>

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

          {/* Tab body — all tabs scroll freely */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

            {/* ── TAB 1: Details ── */}
            {tab === 'details' && (
              <>
                {/* ── Section: Logo + Invoice Info ── */}
                <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">

                  {/* Logo row */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-600 overflow-hidden bg-slate-800 flex items-center justify-center flex-none">
                      {form.logo
                        ? <img src={form.logo} alt="logo" className="w-full h-full object-contain p-1" />
                        : <span className="text-slate-600 text-xl">🏢</span>
                      }
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{form.from.name || 'Your Company'}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Logo from Profile</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-700" />

                  {/* Invoice number */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Invoice No.</label>
                    <input className={inp()} value={form.invoiceNumber}
                      onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Issue Date</label>
                      <input type="date" className={inp()} value={form.issueDate}
                        onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Due Date</label>
                      <input type="date" className={inp()} value={form.dueDate}
                        onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* ── Section: From ── */}
                <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">From</p>
                  <input className={inp(errors.fromName)} placeholder="Your Name / Company *"
                    value={form.from.name}
                    onChange={e => setForm(p => ({ ...p, from: { ...p.from, name: e.target.value } }))} />
                  {errors.fromName && <p className="text-red-400 text-xs -mt-2">{errors.fromName}</p>}
                  <input className={inp()} placeholder="Email"
                    value={form.from.email}
                    onChange={e => setForm(p => ({ ...p, from: { ...p.from, email: e.target.value } }))} />
                  <textarea className={`${inp()} resize-none`} rows={3}
                    placeholder={'Address line 1\nCity, State\nCountry'}
                    value={form.from.address}
                    onChange={e => setForm(p => ({ ...p, from: { ...p.from, address: e.target.value } }))} />
                </div>

                {/* ── Section: Bill To ── */}
                <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Bill To</p>
                  <input className={inp(errors.toName)} placeholder="Client Name *"
                    value={form.to.name}
                    onChange={e => setForm(p => ({ ...p, to: { ...p.to, name: e.target.value } }))} />
                  {errors.toName && <p className="text-red-400 text-xs -mt-2">{errors.toName}</p>}
                  <input className={inp()} placeholder="Email"
                    value={form.to.email}
                    onChange={e => setForm(p => ({ ...p, to: { ...p.to, email: e.target.value } }))} />
                  <textarea className={`${inp()} resize-none`} rows={3}
                    placeholder={'Address line 1\nCity, State\nCountry'}
                    value={form.to.address}
                    onChange={e => setForm(p => ({ ...p, to: { ...p.to, address: e.target.value } }))} />
                </div>
              </>
            )}

            {/* ── TAB 2: Items ── */}
            {tab === 'items' && (
              <>
                {/* Items list */}
                <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Line Items</p>
                  {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

                  {/* Column headers — desktop only */}
                  <div className="hidden sm:grid grid-cols-[1fr_64px_80px_72px_20px] gap-2 px-1">
                    <span className="text-xs font-semibold text-slate-500">Description</span>
                    <span className="text-xs font-semibold text-slate-500 text-center">Qty</span>
                    <span className="text-xs font-semibold text-slate-500 text-center">Rate</span>
                    <span className="text-xs font-semibold text-slate-500 text-right">Amount</span>
                    <span />
                  </div>

                  <div className="flex flex-col gap-2">
                    {form.items.map((item, idx) => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-2 bg-slate-800 rounded-xl px-3 py-3">
                        <input
                          className="flex-1 bg-transparent border-b border-slate-700 px-1 py-1 text-sm text-white outline-none focus:border-blue-500 placeholder-slate-600"
                          placeholder={`Item ${idx + 1} description`}
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)} />
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 sm:flex-none flex flex-col gap-0.5">
                            <label className="text-slate-600 text-xs sm:hidden">Qty</label>
                            <input className="w-full sm:w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white text-center outline-none focus:ring-1 focus:ring-blue-500"
                              type="number" min="1" value={item.qty}
                              onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                          </div>
                          <div className="flex-1 sm:flex-none flex flex-col gap-0.5">
                            <label className="text-slate-600 text-xs sm:hidden">Rate ($)</label>
                            <input className="w-full sm:w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:ring-1 focus:ring-blue-500"
                              type="number" min="0" value={item.rate}
                              onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                          </div>
                          <span className="w-16 text-xs text-right text-blue-400 font-bold flex-none">
                            {fmt(item.qty * item.rate)}
                          </span>
                          <button onClick={() => removeItem(item.id)}
                            className="text-slate-600 hover:text-red-400 transition text-base flex-none">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={addItem}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-bold transition py-1">
                    <span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm">+</span>
                    Add Item
                  </button>
                </div>

                {/* Totals card */}
                <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Summary</p>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-200 font-semibold">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Tax</span>
                      <input className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:ring-1 focus:ring-blue-500"
                        type="number" min="0" placeholder="0" value={form.taxRate}
                        onChange={e => setForm(p => ({ ...p, taxRate: Number(e.target.value) }))} />
                      <span className="text-slate-500">%</span>
                    </div>
                    <span className="text-slate-200 font-semibold">{fmt(taxAmt)}</span>
                  </div>
                  <div className="h-px bg-slate-700 my-1" />
                  <div className="flex justify-between text-base font-black text-white">
                    <span>Total Due</span>
                    <span className="text-blue-400">{fmt(total)}</span>
                  </div>
                </div>

                {/* Notes card */}
                <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Notes</p>
                  <textarea className={`${inp()} resize-none`} rows={3}
                    placeholder="Thank you for your business!"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </>
            )}

            {/* ── TAB 3: Payment ── */}
            {tab === 'payment' && (
              <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Bank Details</p>
                <p className="text-xs text-slate-500 -mt-1">Pre-filled from your profile. Edit for this invoice only.</p>
                {[
                  { label: 'Bank Name',           key: 'bankName',      placeholder: 'e.g. Chase Bank' },
                  { label: 'Account Name',         key: 'accountName',   placeholder: 'e.g. John Smith' },
                  { label: 'Account Number',       key: 'accountNumber', placeholder: 'e.g. 0012345678' },
                  { label: 'Routing / Sort Code',  key: 'routingNumber', placeholder: 'e.g. 026009593' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-slate-400 font-semibold mb-1.5 block">{f.label}</label>
                    <input className={inp()} placeholder={f.placeholder} value={form.bank?.[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, [f.key]: e.target.value } }))} />
                  </div>
                ))}
                {(form.bank?.bankName || form.bank?.accountNumber) && (
                  <div className="bg-slate-900 rounded-xl p-3 mt-1 flex flex-col gap-1.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Preview</p>
                    {form.bank.bankName      && <p className="text-xs text-slate-300">🏦 {form.bank.bankName}</p>}
                    {form.bank.accountName   && <p className="text-xs text-slate-300">👤 {form.bank.accountName}</p>}
                    {form.bank.accountNumber && <p className="text-xs text-slate-300">🔢 {form.bank.accountNumber}</p>}
                    {form.bank.routingNumber && <p className="text-xs text-slate-300">🔀 {form.bank.routingNumber}</p>}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Process button */}
          <div className="flex-none border-t border-slate-800 bg-slate-900 px-4 py-3">
            <button onClick={handleProcess}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/20">
              ⚡ Process Invoice
            </button>
            {processedInvoice && (
              <p className="text-center text-emerald-400 text-xs mt-2 font-semibold">
                ✓ Ready — tap Save or Download above
              </p>
            )}
          </div>
        </div>

        {/* ── PDF PREVIEW — hidden on mobile unless showPreview, full width or right panel ── */}
        <div className={`flex-col items-center justify-center bg-slate-950 overflow-hidden
          ${showPreview ? 'flex w-full' : 'hidden'}
          md:flex md:w-auto md:flex-1`}>
          {!processedInvoice ? (
            <div className="text-center text-slate-600 select-none px-6">
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