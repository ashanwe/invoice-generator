import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULTS = {
  free_credits:          5,
  monthly_base_price:    12.99,
  first_month_discount:  40,
  bulk_discounts:        { 6: 20, 12: 30 },
  credit_packs: [
    { id: 'pack_20',  credits: 20,  price: 4.99,  label: 'Starter',  desc: 'Great for freelancers',   popular: false },
    { id: 'pack_50',  credits: 50,  price: 9.99,  label: 'Pro',       desc: 'Most popular choice',     popular: true  },
    { id: 'pack_100', credits: 100, price: 16.99, label: 'Business',  desc: 'Best value per invoice',  popular: false },
  ],
  promo_banner: { active: false, text: '', color: 'blue' },
}

export function usePricingConfig() {
  const [config, setConfig] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    const { data } = await supabase.from('pricing_config').select('key, value')
    if (data) {
      const parsed = {}
      data.forEach(row => {
        try { parsed[row.key] = row.value }
        catch { parsed[row.key] = DEFAULTS[row.key] }
      })
      setConfig({ ...DEFAULTS, ...parsed })
    }
    setLoading(false)
  }

  return { config, loading, refetch: fetchConfig }
}
