export function formatPhone(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function formatMoney(value) {
  if (value == null || value === '') return ''
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''))
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function parseMoney(value) {
  if (typeof value === 'number') return value
  const n = parseFloat(String(value || '').replace(/[^\d.-]/g, ''))
  return isNaN(n) ? 0 : n
}
