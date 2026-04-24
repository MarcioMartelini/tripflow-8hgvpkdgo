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
    const orcamentosForCat = orcamentos.filter((o) => o.categoria === cat)
    const plannedForCat = orcamentosForCat.reduce(
      (sum, o) => sum + convertCurrency(o.valor_planejado, o.moeda || 'BRL', targetCurrency),
      0,
    )

    let realizedForCat = 0

    // 1. Despesas matching the category
    realizedForCat += despesas
      .filter((d) => d.categoria === cat)
      .reduce((sum, d) => sum + convertCurrency(d.valor, d.moeda, targetCurrency), 0)

    // Helper to match category
    const matchCategory = (
      itemCat: string | undefined,
      itemTipo: string | undefined,
      targetCat: string,
    ) => {
      if (itemCat) {
        if (targetCat === 'atividades' && itemCat === 'atividade') return true
        return itemCat === targetCat
      }
      if (targetCat === 'hospedagem') return itemTipo === 'hotel'
      if (targetCat === 'transporte')
        return itemTipo === 'voo' || itemTipo === 'trem' || itemTipo === 'onibus'
      if (targetCat === 'alimentação') return itemTipo === 'restaurante' || itemTipo === 'refeição'
      if (targetCat === 'atividades') return itemTipo === 'atividade'
      if (targetCat === 'outro') return itemTipo === 'outro'
      return false
    }

    // 2. Aggregate from other collections based on category or tipo
    realizedForCat += reservas
      .filter((r: any) => matchCategory(r.categoria, r.tipo, cat))
      .reduce((sum, r: any) => sum + convertCurrency(r.preco, r.moeda, targetCurrency), 0)

    realizedForCat += tickets
      .filter((t: any) => matchCategory(t.categoria, t.tipo, cat))
      .reduce((sum, t: any) => sum + convertCurrency(t.preco, t.moeda, targetCurrency), 0)

    realizedForCat += itinerarios
      .filter((i: any) => matchCategory(i.categoria, i.tipo, cat))
      .reduce((sum, i: any) => sum + convertCurrency(i.preco, i.moeda, targetCurrency), 0)

    return {
      category: cat,
      planned: plannedForCat,
      realized: realizedForCat,
      diff: plannedForCat - realizedForCat,
      percent: plannedForCat > 0 ? (realizedForCat / plannedForCat) * 100 : 0,
      originalPlannedValue: orcamentosForCat.reduce((sum, o) => sum + o.valor_planejado, 0),
      orcamentoId: orcamentosForCat.length > 0 ? orcamentosForCat[0].id : undefined,
    }
  })
}
