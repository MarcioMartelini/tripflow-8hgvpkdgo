import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getOrcamentos, getDespesas, OrcamentoPlanejado, Despesa } from '@/services/finances'
import { getTickets, Ticket } from '@/services/tickets'
import { getReservas, Reserva } from '@/services/reservas'
import { getItinerarioByTrip, ItinerarioEvent } from '@/services/itinerario'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react'
import { generatePDF } from '@/lib/pdf-utils'
import { calculateBudgetData } from '@/lib/budget-utils'
import { SummaryCards } from '@/components/trip-budget/SummaryCards'
import { ComparativeChart } from '@/components/trip-budget/ComparativeChart'
import { PlanningTable } from '@/components/trip-budget/PlanningTable'
import { ExpenseManager } from '@/components/trip-budget/ExpenseManager'

export default function TripBudget() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuth()
  const { toast } = useToast()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      await generatePDF('pdf-content', `Orcamento_${trip?.title || 'Viagem'}`)
      toast({ title: 'PDF gerado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
    } finally {
      setIsGeneratingPDF(false)
    }
  }
  const baseCurrency = trip?.moeda || user?.moeda_padrao || 'BRL'
  const [orcamentos, setOrcamentos] = useState<OrcamentoPlanejado[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [itinerarios, setItinerarios] = useState<ItinerarioEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    if (!tripId) return
    try {
      setError(false)
      const [tripData, oData, dData, tData, rData, iData] = await Promise.all([
        getTrip(tripId),
        getOrcamentos(tripId),
        getDespesas(tripId),
        getTickets(tripId),
        getReservas(tripId),
        getItinerarioByTrip(tripId),
      ])
      setTrip(tripData)
      setOrcamentos(oData)
      setDespesas(dData)
      setTickets(tData)
      setReservas(rData)
      setItinerarios(iData)
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
  useRealtime('tickets', loadData)
  useRealtime('reservas', loadData)
  useRealtime('itinerario', loadData)

  const categoryData = useMemo(
    () => calculateBudgetData(orcamentos, despesas, tickets, reservas, itinerarios, baseCurrency),
    [orcamentos, despesas, tickets, reservas, itinerarios, baseCurrency],
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
    <div id="pdf-content" className="container py-8 px-4 animate-fade-in space-y-8 bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button variant="ghost" className="mb-4 -ml-4 text-slate-500 print-hidden" asChild>
            <Link to={`/trips/${tripId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Orçamento de {trip.title}</h1>
          <p className="text-sm text-muted-foreground">Moeda base: {baseCurrency}</p>
        </div>
        <Button
          onClick={handleGeneratePDF}
          variant="outline"
          className="print-hidden"
          disabled={isGeneratingPDF}
        >
          <Printer className="h-4 w-4 mr-2" /> {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
        </Button>
      </div>

      <SummaryCards data={categoryData} baseCurrency={baseCurrency} trip={trip} />
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
