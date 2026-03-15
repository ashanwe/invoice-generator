import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const { toasts, toast, remove } = useToast()
  const [form, setForm]     = useState({
    full_name: '', email: '', address: '',
    bank_name: '', bank_account_name: '', bank_account_number: '', bank_routing: ''
  })
  const [logoFile, setLogoFile]         = useState(null)
  const [logoPreview, setLogoPreview]   = useState(null)
  const [logoRemoved, setLogoRemoved]   = useState(false)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:           profile.full_name || '',
        email:               profile.email || user?.email || '',
        address:             profile.address || '',
        bank_name:           profile.bank_name || '',
        bank_account_name:   profile.bank_account_name || '',
        bank_account_number: profile.bank_account_number || '',
        bank_routing:        profile.bank_routing || '',
      })
      setLogoPreview(profile.logo_url || null)
    }
  }, [profile])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setLogoRemoved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    let logo_url = logoRemoved ? null : (profile?.logo_url || null)

    // Upload logo if changed
    if (logoFile) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true })
      if (uploadError) {
        console.error('Logo upload error:', uploadError.message)
        toast(`Logo upload failed: ${uploadError.message}. Profile saved without logo.`, 'warning')
      } else {
        const { data } = supabase.storage.from('logos').getPublicUrl(path)
        logo_url = data.publicUrl + '?t=' + Date.now()
      }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...form, logo_url, updated_at: new Date().toISOString() })

    if (error) {
      console.error('Profile save error:', error.message)
      toast(`Save failed: ${error.message}`, 'error')
    } else {
      await refreshProfile()
      toast('Profile saved!', 'success')
      await refreshProfile()
    }
    setSaving(false)
  }

  const inp = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition'
  const label = 'text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide'

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
      <Toast toasts={toasts} remove={remove} />
      <div className="max-w-2xl mx-auto w-full">

        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-white">Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Your details are pre-filled into every new invoice</p>
        </div>

        {/* Logo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-4">
          <h2 className="text-sm font-bold text-white mb-4">Company Logo</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center bg-slate-800 flex-none">
              {logoPreview
                ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                : <span className="text-slate-500 text-2xl">🏢</span>
              }
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition text-center">
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {logoPreview && (
                <button onClick={() => { setLogoPreview(null); setLogoFile(null); setLogoRemoved(true) }}
                  className="text-red-400 text-xs hover:text-red-300 text-center">Remove</button>
              )}
              <p className="text-slate-500 text-xs">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-4">
          <h2 className="text-sm font-bold text-white mb-4">Your Details</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>Full Name / Company</label>
              <input className={inp} placeholder="Your name or company"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input className={inp} type="email" placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Address</label>
              <textarea className={`${inp} resize-none`} rows={3}
                placeholder={'123 Main St\nCity, State 12345\nCountry'}
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-6">
          <h2 className="text-sm font-bold text-white mb-1">Bank Details</h2>
          <p className="text-slate-500 text-xs mb-4">Shown at the bottom of every invoice</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Bank Name</label>
              <input className={inp} placeholder="e.g. Chase Bank"
                value={form.bank_name}
                onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Account Name</label>
              <input className={inp} placeholder="e.g. John Smith"
                value={form.bank_account_name}
                onChange={e => setForm(p => ({ ...p, bank_account_name: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Account Number</label>
              <input className={inp} placeholder="e.g. 0012345678"
                value={form.bank_account_number}
                onChange={e => setForm(p => ({ ...p, bank_account_number: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Routing / Sort Code</label>
              <input className={inp} placeholder="e.g. 026009593"
                value={form.bank_routing}
                onChange={e => setForm(p => ({ ...p, bank_routing: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/20">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

      </div>
    </div>
  )
}