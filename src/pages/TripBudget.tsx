import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getOrcamentos, getDespesas, OrcamentoPlanejado, Despesa } from '@/services/finances'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react'
import { calculateBudgetData } from '@/lib/budget-utils'
import { SummaryCards } from '@/components/trip-budget/SummaryCards'
import { ComparativeChart } from '@/components/trip-budget/ComparativeChart'
import { PlanningTable } from '@/components/trip-budget/PlanningTable'
import { ExpenseManager } from '@/components/trip-budget/ExpenseManager'

export default function TripBudget() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuth()
  const baseCurrency = user?.moeda_padrao || 'BRL'

  const [trip, setTrip] = useState<Trip | null>(null)
  const [orcamentos, setOrcamentos] = useState<OrcamentoPlanejado[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    if (!tripId) return
    try {
      setError(false)
      const [tripData, oData, dData] = await Promise.all([
        getTrip(tripId),
        getOrcamentos(tripId),
        getDespesas(tripId),
      ])
      setTrip(tripData)
      setOrcamentos(oData)
      setDespesas(dData)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tripId])

  useRealtime('orcamento_planejado', loadData)
  useRealtime('despesas', loadData)

  const categoryData = useMemo(
    () => calculateBudgetData(orcamentos, despesas, baseCurrency),
    [orcamentos, despesas, baseCurrency],
  )

  if (loading) {
    return (
      <div className="container py-8 px-4 space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro ao carregar orçamento</h2>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <Button variant="ghost" className="mb-4 -ml-4 text-slate-500" asChild>
            <Link to={`/trips/${tripId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Orçamento de {trip.title}</h1>
        </div>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="h-4 w-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Relatório de Orçamento - {trip.title}</h1>
        <p className="text-sm text-muted-foreground">Moeda base: {baseCurrency}</p>
      </div>

      <SummaryCards data={categoryData} baseCurrency={baseCurrency} />
      <ComparativeChart data={categoryData} baseCurrency={baseCurrency} />
      <PlanningTable
        data={categoryData}
        baseCurrency={baseCurrency}
        tripId={tripId!}
        onReload={loadData}
      />
      <ExpenseManager despesas={despesas} tripId={tripId!} onReload={loadData} />
    </div>
  )
}
