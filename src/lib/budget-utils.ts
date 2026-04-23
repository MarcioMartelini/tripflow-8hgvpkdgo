import { OrcamentoPlanejado, Despesa } from '@/services/finances'
import { convertCurrency } from '@/lib/currency'

export const CATEGORIAS = [
  'hospedagem',
  'transporte',
  'alimentação',
  'atividades',
  'compras',
  'outro',
]

export const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'AUD']

export interface CategoryData {
  category: string
  planned: number
  realized: number
  diff: number
  percent: number
  orcamentoId?: string
  originalPlannedValue: number
  originalPlannedMoeda: string
}

export function calculateBudgetData(
  orcamentos: OrcamentoPlanejado[],
  despesas: Despesa[],
  baseCurrency: string,
): CategoryData[] {
  return CATEGORIAS.map((cat) => {
    const plannedObj = orcamentos.find((o) => o.categoria === cat)
    const plannedVal = plannedObj
      ? convertCurrency(plannedObj.valor_planejado, plannedObj.moeda, baseCurrency)
      : 0

    const catDespesas = despesas.filter((d) => d.categoria === cat)
    const realizedVal = catDespesas.reduce(
      (acc, d) => acc + convertCurrency(d.valor, d.moeda, baseCurrency),
      0,
    )

    return {
      category: cat,
      planned: plannedVal,
      realized: realizedVal,
      diff: plannedVal - realizedVal,
      percent: plannedVal > 0 ? (realizedVal / plannedVal) * 100 : 0,
      orcamentoId: plannedObj?.id,
      originalPlannedValue: plannedObj?.valor_planejado || 0,
      originalPlannedMoeda: plannedObj?.moeda || baseCurrency,
    }
  })
}
