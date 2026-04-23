export const EXCHANGE_RATES: Record<string, number> = {
  BRL: 1.0,
  USD: 5.2,
  EUR: 5.7,
  GBP: 6.5,
  AUD: 3.4,
}

export function convertCurrency(amount: number, from: string, to: string): number {
  const rateFrom = EXCHANGE_RATES[from?.toUpperCase()] || 1.0
  const rateTo = EXCHANGE_RATES[to?.toUpperCase()] || 1.0
  const amountInBrl = amount * rateFrom
  return amountInBrl / rateTo
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(amount)
}
