import { OrcamentoPlanejado, Despesa } from '@/services/finances'
import { Ticket } from '@/services/tickets'
import { Reserva } from '@/services/reservas'
import { ItinerarioEvent } from '@/services/itinerario'

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

export const convertCurrency = (
  value: number | undefined,
  from: string | undefined,
  to: string,
) => {
  if (!value) return 0
  const fromRate = EXCHANGE_RATES[(from || 'BRL').toUpperCase()] || 1
  const toRate = EXCHANGE_RATES[to.toUpperCase()] || 1

  const valueInBrl = value * fromRate
  return valueInBrl / toRate
}

export interface CategoryData {
  category: string
  planned: number
  realized: number
  diff: number
  percent: number
  originalPlannedValue: number
  orcamentoId?: string
}

export const calculateBudgetData = (
  orcamentos: OrcamentoPlanejado[],
  despesas: Despesa[],
  tickets: Ticket[],
  reservas: Reserva[],
  itinerarios: ItinerarioEvent[],
  targetCurrency: string = 'BRL',
): CategoryData[] => {
  return CATEGORIAS.map((cat) => {
    const orcamento = orcamentos.find((o) => o.categoria === cat)
    const plannedForCat = orcamento
      ? convertCurrency(orcamento.valor_planejado, orcamento.moeda || 'BRL', targetCurrency)
      : 0

    let realizedForCat = 0

    // 1. Despesas matching the category
    realizedForCat += despesas
      .filter((d) => d.categoria === cat)
      .reduce((sum, d) => sum + convertCurrency(d.valor, d.moeda, targetCurrency), 0)

    // 2. Aggregate from other collections based on category logic
    if (cat === 'hospedagem') {
      realizedForCat += reservas
        .filter((r) => r.tipo === 'hotel')
        .reduce((sum, r) => sum + convertCurrency(r.preco, r.moeda, targetCurrency), 0)
      realizedForCat += itinerarios
        .filter((i) => i.tipo === 'hotel')
        .reduce((sum, i) => sum + convertCurrency(i.preco, i.moeda, targetCurrency), 0)
    } else if (cat === 'transporte') {
      realizedForCat += tickets
        .filter((t) => t.tipo !== 'outro')
        .reduce((sum, t) => sum + convertCurrency(t.preco, t.moeda, targetCurrency), 0)
      realizedForCat += itinerarios
        .filter((i) => i.tipo === 'voo')
        .reduce((sum, i) => sum + convertCurrency(i.preco, i.moeda, targetCurrency), 0)
    } else if (cat === 'alimentação') {
      realizedForCat += reservas
        .filter((r) => r.tipo === 'restaurante')
        .reduce((sum, r) => sum + convertCurrency(r.preco, r.moeda, targetCurrency), 0)
      realizedForCat += itinerarios
        .filter((i) => i.tipo === 'refeição')
        .reduce((sum, i) => sum + convertCurrency(i.preco, i.moeda, targetCurrency), 0)
    } else if (cat === 'atividades') {
      realizedForCat += reservas
        .filter((r) => r.tipo === 'atividade')
        .reduce((sum, r) => sum + convertCurrency(r.preco, r.moeda, targetCurrency), 0)
      realizedForCat += itinerarios
        .filter((i) => i.tipo === 'atividade')
        .reduce((sum, i) => sum + convertCurrency(i.preco, i.moeda, targetCurrency), 0)
    } else if (cat === 'outro') {
      realizedForCat += reservas
        .filter((r) => r.tipo === 'outro')
        .reduce((sum, r) => sum + convertCurrency(r.preco, r.moeda, targetCurrency), 0)
      realizedForCat += tickets
        .filter((t) => t.tipo === 'outro')
        .reduce((sum, t) => sum + convertCurrency(t.preco, t.moeda, targetCurrency), 0)
      realizedForCat += itinerarios
        .filter((i) => i.tipo === 'outro')
        .reduce((sum, i) => sum + convertCurrency(i.preco, i.moeda, targetCurrency), 0)
    }

    return {
      category: cat,
      planned: plannedForCat,
      realized: realizedForCat,
      diff: plannedForCat - realizedForCat,
      percent: plannedForCat > 0 ? (realizedForCat / plannedForCat) * 100 : 0,
      originalPlannedValue: orcamento ? orcamento.valor_planejado : 0,
      orcamentoId: orcamento?.id,
    }
  })
}
