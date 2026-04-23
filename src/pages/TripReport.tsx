import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getTravelers, Traveler } from '@/services/travelers'
import { getItinerarioByTrip, ItinerarioEvent } from '@/services/itinerario'
import { getOrcamentos, getDespesas } from '@/services/finances'
import { getTripDocuments, Documento } from '@/services/documentos'
import { calculateBudgetData, CategoryData } from '@/lib/budget-utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { format, differenceInDays, isBefore, addDays, parseISO, isValid } from 'date-fns'

const chartConfig = {
  planned: {
    label: 'Planejado',
    color: '#3b82f6',
  },
  realized: {
    label: 'Realizado',
    color: '#22c55e',
  },
}

export default function TripReport() {
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [itinerary, setItinerary] = useState<ItinerarioEvent[]>([])
  const [budgetData, setBudgetData] = useState<CategoryData[]>([])
  const [documents, setDocuments] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [tripData, travelersData, itineraryData, orcamentos, despesas, docs] =
        await Promise.all([
          getTrip(id),
          getTravelers(id),
          getItinerarioByTrip(id),
          getOrcamentos(id),
          getDespesas(id),
          getTripDocuments(id),
        ])

      setTrip(tripData)
      setTravelers(travelersData)
      setItinerary(itineraryData)
      setDocuments(docs)

      const calcData = calculateBudgetData(orcamentos, despesas, tripData.moeda || 'BRL')
      setBudgetData(calcData)

      setError(false)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-'
  }

  const formatCurrency = (val: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(val)
  }

  const getDocStatus = (dateStr?: string) => {
    if (!dateStr)
      return { label: 'Válido', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 }
    const exp = parseISO(dateStr)
    if (!isValid(exp))
      return { label: 'Válido', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 }

    const today = new Date()
    if (isBefore(exp, today))
      return { label: 'Expirado', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle }
    if (isBefore(exp, addDays(today, 30)))
      return {
        label: 'Próximo de expirar',
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        icon: AlertTriangle,
      }

    return { label: 'Válido', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 }
  }

  if (loading) {
    return (
      <div className="container py-8 px-4 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold">Erro ao carregar relatório</h2>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center space-y-4">
        <Info className="h-12 w-12 text-slate-400" />
        <h2 className="text-2xl font-bold">Nenhum dado para gerar relatório</h2>
        <Button asChild>
          <Link to="/trips">Voltar para Viagens</Link>
        </Button>
      </div>
    )
  }

  const totalPlanned = budgetData.reduce((acc, item) => acc + item.planned, 0)
  const totalRealized = budgetData.reduce((acc, item) => acc + item.realized, 0)
  const totalDiff = totalPlanned - totalRealized
  const isOverBudget = totalRealized > totalPlanned

  return (
    <div className="container py-8 px-4 max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Button variant="ghost" className="mb-2 -ml-4 text-slate-500 print:hidden" asChild>
            <Link to={`/trips/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Relatório de {trip.title}</h1>
        </div>
        <Button onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Período e Duração</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {trip.start_date && trip.end_date
                ? `${Math.max(1, differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)))} dias`
                : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Viajantes</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{travelers.length}</div>
            <p
              className="text-xs text-slate-500 mt-1 truncate"
              title={travelers.map((t) => t.nome).join(', ')}
            >
              {travelers.length > 0 ? travelers.map((t) => t.nome).join(', ') : 'Nenhum viajante'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Destino</CardTitle>
            <MapPin className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={trip.destination}>
              {trip.destination}
            </div>
            <p className="text-xs text-slate-500 mt-1 capitalize">{trip.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Relatório</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{format(new Date(), 'dd/MM/yyyy')}</div>
            <p className="text-xs text-slate-500 mt-1">Data de geração</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Itinerário Realizado</h2>
        {itinerary.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            Nenhuma atividade registrada
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itinerary.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(ev.data)}</TableCell>
                    <TableCell>
                      {ev.hora_inicio || '-'} {ev.hora_fim ? `às ${ev.hora_fim}` : ''}
                    </TableCell>
                    <TableCell className="font-medium">{ev.atividade}</TableCell>
                    <TableCell>{ev.local || '-'}</TableCell>
                    <TableCell className="capitalize">{ev.tipo || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Comparativo de Orçamento</h2>
        {isOverBudget && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 border border-red-200">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Atenção: Orçamento Excedido</h4>
              <p className="text-sm mt-1">
                O total realizado superou o valor planejado em{' '}
                {formatCurrency(Math.abs(totalDiff), trip.moeda)}.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border rounded-lg overflow-x-auto self-start">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Planejado</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetData.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell className="capitalize font-medium">{cat.category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cat.planned, trip.moeda)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cat.realized, trip.moeda)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${cat.diff < 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {formatCurrency(cat.diff, trip.moeda)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalPlanned, trip.moeda)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalRealized, trip.moeda)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${totalDiff < 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {formatCurrency(totalDiff, trip.moeda)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <Card className="shadow-none border border-slate-200">
            <CardContent className="pt-6">
              {totalPlanned === 0 && totalRealized === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Nenhuma despesa registrada
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={budgetData} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      className="capitalize text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                      width={80}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realized" fill="var(--color-realized)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Documentos Utilizados</h2>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            Nenhum documento registrado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const status = getDocStatus(doc.data_expiracao)
              const StatusIcon = status.icon
              return (
                <Card key={doc.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`p-3 rounded-lg shrink-0 ${status.bg}`}>
                      <FileText className={`h-6 w-6 ${status.color}`} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-medium text-slate-900 truncate" title={doc.nome_arquivo}>
                        {doc.nome_arquivo}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        {doc.tipo || 'Outro'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {doc.data_expiracao && (
                          <span className="text-xs text-slate-500 ml-1">
                            (até {formatDate(doc.data_expiracao)})
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
