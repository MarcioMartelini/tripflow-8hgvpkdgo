import { OrcamentoPlanejado, Despesa } from '@/services/finances'

export const EXCHANGE_RATES: Record<string, number> = {
  BRL: 1,
  USD: 5.2,
  EUR: 5.7,
  GBP: 6.5,
  AUD: 3.4,
}

export const CATEGORIAS = [
  'hospedagem',
  'transporte',
  'alimentação',
  'atividades',
  'compras',
  'outro',
]

export const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'AUD']

export const convertCurrency = (value: number, from: string, to: string) => {
  const fromRate = EXCHANGE_RATES[from.toUpperCase()] || 1
  const toRate = EXCHANGE_RATES[to.toUpperCase()] || 1

  // Convert from 'from' currency to BRL base
  const valueInBrl = value * fromRate

  // Convert from BRL base to 'to' currency
  return valueInBrl / toRate
}

export interface BudgetData {
  category: string
  planned: number
  realized: number
  diff: number
  percent: number
}

export const calculateBudgetData = (
  orcamentos: OrcamentoPlanejado[],
  despesas: Despesa[],
  targetCurrency: string = 'BRL',
): BudgetData[] => {
  return CATEGORIAS.map((cat) => {
    const plannedForCat = orcamentos
      .filter((o) => o.categoria === cat)
      .reduce(
        (sum, o) => sum + convertCurrency(o.valor_planejado, o.moeda || 'BRL', targetCurrency),
        0,
      )

    const realizedForCat = despesas
      .filter((d) => d.categoria === cat)
      .reduce((sum, d) => sum + convertCurrency(d.valor, d.moeda || 'BRL', targetCurrency), 0)

    return {
      category: cat,
      planned: plannedForCat,
      realized: realizedForCat,
      diff: plannedForCat - realizedForCat,
      percent: plannedForCat > 0 ? (realizedForCat / plannedForCat) * 100 : 0,
    }
  })
}
