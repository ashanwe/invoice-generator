import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const defaultInvoice = {
  invoiceNumber: `INV-${Date.now()}`,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  logo: null,
  from: { name: '', email: '', address: '' },
  to:   { name: '', email: '', address: '' },
  items: [
    { id: uuidv4(), description: '', qty: 1, rate: 0 }
  ],
  taxRate: 0,
  notes: '',
  bank: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
  },
}

export function useInvoice() {
  const [invoice, setInvoice] = useState(defaultInvoice)

  const addItem = () => setInvoice(prev => ({
    ...prev,
    items: [...prev.items, { id: uuidv4(), description: '', qty: 1, rate: 0 }]
  }))

  const removeItem = (id) => setInvoice(prev => ({
    ...prev,
    items: prev.items.filter(item => item.id !== id)
  }))

  const updateItem = (id, field, value) => setInvoice(prev => ({
    ...prev,
    items: prev.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    )
  }))

  return { invoice, setInvoice, addItem, removeItem, updateItem }
}