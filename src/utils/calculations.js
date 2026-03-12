export const subtotal = (items) =>
  items.reduce((sum, item) => sum + item.qty * item.rate, 0)

export const taxAmount = (items, taxRate) =>
  subtotal(items) * (taxRate / 100)

export const total = (items, taxRate) =>
  subtotal(items) + taxAmount(items, taxRate)

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(amount)