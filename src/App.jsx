import { useState, useEffect } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from './templates/InvoicePDF'
import { v4 as uuidv4 } from 'uuid'

const emptyForm = () => ({
  invoiceNumber: `INV-${Date.now()}`,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  logo: null,
  from: { name: '', email: '', address: '' },
  to:   { name: '', email: '', address: '' },
  items: [{ id: uuidv4(), description: '', qty: 1, rate: 0 }],
  taxRate: 0,
  notes: '',
  bank: { bankName: '', accountName: '', accountNumber: '', routingNumber: '' },
})

const TABS = [
  { id: 'details',  label: '1  Details',  icon: '🏢' },
  { id: 'items',    label: '2  Items',    icon: '📦' },
  { id: 'payment',  label: '3  Payment',  icon: '🏦' },
]

export default function App() {
  const [form, setForm]                   = useState(emptyForm())
  const [processedInvoice, setProcessed]  = useState(null)
  const [isClient, setIsClient]           = useState(false)
  const [savedInvoices, setSavedInvoices] = useState([])
  const [view, setView]                   = useState('editor')
  const [tab, setTab]                     = useState('details')
  const [logoPreview, setLogoPreview]     = useState(null)
  const [errors, setErrors]               = useState({})

  useEffect(() => setIsClient(true), [])

  // ── Logo ──
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result)
      setForm(p => ({ ...p, logo: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  // ── Items ──
  const addItem = () => setForm(p => ({
    ...p, items: [...p.items, { id: uuidv4(), description: '', qty: 1, rate: 0 }]
  }))
  const removeItem = (id) => setForm(p => ({
    ...p, items: p.items.filter(i => i.id !== id)
  }))
  const updateItem = (id, field, value) => setForm(p => ({
    ...p, items: p.items.map(i => i.id === id ? { ...i, [field]: value } : i)
  }))

  // ── Totals ──
  const subtotal = form.items.reduce((s, i) => s + i.qty * i.rate, 0)
  const taxAmt   = subtotal * (form.taxRate / 100)
  const total    = subtotal + taxAmt
  const fmt      = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  // ── Validate ──
  const validate = () => {
    const e = {}
    if (!form.from.name.trim()) e.fromName = 'Required'
    if (!form.to.name.trim())   e.toName   = 'Required'
    if (form.items.every(i => !i.description.trim())) e.items = 'Add at least one item'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Process ──
  const handleProcess = () => {
    if (!validate()) {
      if (errors.fromName || errors.toName) setTab('details')
      else if (errors.items) setTab('items')
      return
    }
    setProcessed({ ...form, items: form.items.map(i => ({ ...i })) })
  }

  // ── Save ──
  const handleSave = () => {
    if (!processedInvoice) return
    setSavedInvoices(p => [{ ...processedInvoice, savedAt: new Date().toLocaleString(), id: Date.now() }, ...p])
    alert(`✓ Invoice ${processedInvoice.invoiceNumber} saved!`)
  }

  // ── Print ──
  const handlePrint = () => {
    const iframe = document.querySelector('iframe')
    if (iframe) { iframe.contentWindow.focus(); iframe.contentWindow.print() }
  }

  // ── Load saved ──
  const handleLoad = (saved) => {
    setForm(saved); setProcessed(saved)
    setLogoPreview(saved.logo || null)
    setErrors({}); setTab('details'); setView('editor')
  }

  const inp = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition ${err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">

      {/* ══ NAV ══ */}
      <nav className="flex-none bg-white border-b px-5 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-lg w-8 h-8 flex items-center justify-center font-bold text-sm">IV</div>
          <h1 className="text-base font-bold text-gray-800">Invoice Generator</h1>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setView(v => v === 'editor' ? 'list' : 'editor')}
            className="border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
          >
            {view === 'editor' ? `📋 Saved (${savedInvoices.length})` : '✏️ Editor'}
          </button>

          {processedInvoice && view === 'editor' && (
            <>
              <button onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                💾 Save
              </button>
              <PDFDownloadLink
                document={<InvoicePDF invoice={processedInvoice} />}
                fileName={`${processedInvoice.to.name.replace(/\s+/g, '_')}_${processedInvoice.invoiceNumber}.pdf`}
              >
                {({ loading }) => (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                    {loading ? '...' : '⬇ Download'}
                  </button>
                )}
              </PDFDownloadLink>
              <button onClick={handlePrint}
                className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                🖨 Print
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ══ SAVED LIST ══ */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Saved Invoices</h2>
            {savedInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl border p-16 text-center text-gray-400">
                <div className="text-5xl mb-3">📂</div>
                <p>No saved invoices yet.</p>
                <p className="text-sm mt-1">Process an invoice and click 💾 Save.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {savedInvoices.map(inv => (
                  <div key={inv.id} className="bg-white rounded-xl border px-5 py-4 flex justify-between items-center hover:shadow-md transition">
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{inv.invoiceNumber}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        To: <span className="font-semibold text-gray-700">{inv.to.name}</span> · {inv.savedAt}
                      </div>
                    </div>
                    <button onClick={() => handleLoad(inv)}
                      className="text-blue-600 text-xs font-bold hover:underline">Open →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ EDITOR ══ */}
      {view === 'editor' && (
        <div className="flex-1 flex overflow-hidden">

          {/* ── LEFT PANEL ── */}
          <div className="w-[46%] flex flex-col bg-white border-r overflow-hidden">

            {/* Tab bar */}
            <div className="flex-none flex border-b bg-slate-50">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                    tab === t.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content — fills remaining height, no scroll */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

              {/* ── TAB 1: Details ── */}
              {tab === 'details' && (
                <>
                  {/* Logo + Invoice Info row */}
                  <div className="gap-3 items-start">
                    {/* Logo */}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-500">Logo</span>
                      <label className="cursor-pointer flex items-center justify-center w-20 h-12 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 transition overflow-hidden">
                        {logoPreview
                          ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                          : <span className="text-slate-400 text-xs text-center leading-tight">+ Upload</span>
                        }
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                      {logoPreview && (
                        <button onClick={() => { setLogoPreview(null); setForm(p => ({ ...p, logo: null })) }}
                          className="text-red-400 text-xs hover:text-red-600">Remove</button>
                      )}
                    </div>

                    {/* Invoice No + Dates */}
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

                  <div className="border-t border-slate-100" />

                  {/* From / To — side by side */}
                  <div className="flex gap-3 flex-1">
                    <div className="flex-1 flex flex-col gap-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">From</p>
                      <input className={inp(errors.fromName)} placeholder="Your Name / Company *"
                        value={form.from.name}
                        onChange={e => setForm(p => ({ ...p, from: { ...p.from, name: e.target.value } }))} />
                      {errors.fromName && <p className="text-red-500 text-xs -mt-1">{errors.fromName}</p>}
                      <input className={inp()} placeholder="Email"
                        value={form.from.email}
                        onChange={e => setForm(p => ({ ...p, from: { ...p.from, email: e.target.value } }))} />
                      <textarea className={`${inp()} flex-1 resize-none`} placeholder="Address (optional)"
                        value={form.from.address}
                        onChange={e => setForm(p => ({ ...p, from: { ...p.from, address: e.target.value } }))} />
                    </div>

                    <div className="w-px bg-slate-100" />

                    <div className="flex-1 flex flex-col gap-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Bill To</p>
                      <input className={inp(errors.toName)} placeholder="Client Name *"
                        value={form.to.name}
                        onChange={e => setForm(p => ({ ...p, to: { ...p.to, name: e.target.value } }))} />
                      {errors.toName && <p className="text-red-500 text-xs -mt-1">{errors.toName}</p>}
                      <input className={inp()} placeholder="Email"
                        value={form.to.email}
                        onChange={e => setForm(p => ({ ...p, to: { ...p.to, email: e.target.value } }))} />
                      <textarea className={`${inp()} flex-1 resize-none`} placeholder="Address (optional)"
                        value={form.to.address}
                        onChange={e => setForm(p => ({ ...p, to: { ...p.to, address: e.target.value } }))} />
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB 2: Items ── */}
              {tab === 'items' && (
                <>
                  {/* Column headers */}
                  <div className="flex gap-2 px-1">
                    <span className="flex-1 text-xs font-semibold text-slate-400">Description</span>
                    <span className="w-14 text-xs font-semibold text-slate-400 text-center">Qty</span>
                    <span className="w-20 text-xs font-semibold text-slate-400 text-center">Rate</span>
                    <span className="w-16 text-xs font-semibold text-slate-400 text-right">Amount</span>
                    <span className="w-5" />
                  </div>

                  {/* Items list — scrollable only if many items */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}
                    {form.items.map((item, idx) => (
                      <div key={item.id} className="flex gap-2 items-center bg-slate-50 rounded-lg px-2 py-1.5">
                        <input className="flex-1 bg-transparent border-b border-slate-200 px-1 py-1 text-sm outline-none focus:border-blue-400"
                          placeholder={`Item ${idx + 1}`}
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)} />
                        <input className="w-14 bg-white border border-slate-200 rounded-md px-2 py-1 text-sm text-center outline-none focus:ring-1 focus:ring-blue-300"
                          type="number" min="1" value={item.qty}
                          onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                        <input className="w-20 bg-white border border-slate-200 rounded-md px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-300"
                          type="number" min="0" value={item.rate}
                          onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                        <span className="w-16 text-sm text-right font-semibold text-slate-700">
                          {fmt(item.qty * item.rate)}
                        </span>
                        <button onClick={() => removeItem(item.id)}
                          className="w-5 text-slate-300 hover:text-red-500 text-base transition">✕</button>
                      </div>
                    ))}
                    <button onClick={addItem}
                      className="mt-1 text-blue-600 text-xs font-bold hover:underline self-start">
                      + Add Item
                    </button>
                  </div>

                  {/* Totals summary */}
                  <div className="flex-none border-t border-slate-100 pt-3 flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Subtotal</span><span className="font-semibold text-slate-700">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>Tax</span>
                        <input className="w-14 border border-slate-200 rounded px-2 py-0.5 text-xs text-center outline-none focus:ring-1 focus:ring-blue-300"
                          type="number" min="0" placeholder="0%" value={form.taxRate}
                          onChange={e => setForm(p => ({ ...p, taxRate: Number(e.target.value) }))} />
                        <span>%</span>
                      </div>
                      <span className="font-semibold text-slate-700">{fmt(taxAmt)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-blue-600 border-t border-slate-200 pt-2 mt-1">
                      <span>Total Due</span><span>{fmt(total)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex-none">
                    <textarea className={`${inp()} resize-none`} rows={2}
                      placeholder="Message to client (e.g. Thank you for your business!)"
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </>
              )}

              {/* ── TAB 3: Payment / Bank ── */}
              {tab === 'payment' && (
                <div className="flex flex-col gap-3 flex-1">
                  <p className="text-xs text-slate-500">These details will appear at the bottom of the invoice.</p>
                  <div className="flex flex-col gap-2 flex-1">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Bank Name</label>
                      <input className={inp()} placeholder="e.g. Chase Bank"
                        value={form.bank?.bankName || ''}
                        onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, bankName: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Account Name</label>
                      <input className={inp()} placeholder="e.g. John Smith"
                        value={form.bank?.accountName || ''}
                        onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, accountName: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Account Number</label>
                      <input className={inp()} placeholder="e.g. 0012345678"
                        value={form.bank?.accountNumber || ''}
                        onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, accountNumber: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Routing / Sort Code <span className="text-slate-400">(optional)</span></label>
                      <input className={inp()} placeholder="e.g. 026009593"
                        value={form.bank?.routingNumber || ''}
                        onChange={e => setForm(p => ({ ...p, bank: { ...p.bank, routingNumber: e.target.value } }))} />
                    </div>
                  </div>

                  {/* Preview card */}
                  {(form.bank?.bankName || form.bank?.accountNumber) && (
                    <div className="flex-none bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Preview</p>
                      {form.bank.bankName     && <p className="text-xs text-slate-600">🏦 {form.bank.bankName}</p>}
                      {form.bank.accountName  && <p className="text-xs text-slate-600">👤 {form.bank.accountName}</p>}
                      {form.bank.accountNumber && <p className="text-xs text-slate-600">🔢 {form.bank.accountNumber}</p>}
                      {form.bank.routingNumber && <p className="text-xs text-slate-600">🔀 {form.bank.routingNumber}</p>}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ── Process Button ── always visible at bottom */}
            <div className="flex-none border-t bg-white px-4 py-3">
              <button
                onClick={handleProcess}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm"
              >
                ⚡ Process Invoice
              </button>
              {processedInvoice && (
                <p className="text-center text-emerald-600 text-xs mt-2 font-semibold">
                  ✓ Invoice ready — use Download or Print above
                </p>
              )}
            </div>

          </div>

          {/* ── RIGHT PANEL: PDF Preview ── */}
          <div className="flex-1 flex flex-col bg-slate-200 overflow-hidden">
            {!processedInvoice ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 select-none">
                <div className="text-6xl">📄</div>
                <div className="text-center">
                  <p className="font-bold text-base text-slate-500">Invoice preview</p>
                  <p className="text-sm mt-1">Fill in the form then click</p>
                  <p className="text-blue-500 font-bold text-sm">⚡ Process Invoice</p>
                </div>
              </div>
            ) : isClient ? (
              <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none', flex: 1 }}>
                <InvoicePDF invoice={processedInvoice} />
              </PDFViewer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">Loading…</div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}