import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getTravelers, Traveler } from '@/services/travelers'
import { getItinerarioByTrip, ItinerarioEvent } from '@/services/itinerario'
import { getOrcamentos, getDespesas, OrcamentoPlanejado, Despesa } from '@/services/finances'
import { getTripDocuments, Documento } from '@/services/documentos'
import { getTickets, Ticket } from '@/services/tickets'
import { getReservas, Reserva } from '@/services/reservas'
import { calculateBudgetData } from '@/lib/budget-utils'
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
  Plane,
  Bed,
} from 'lucide-react'
import { format, differenceInDays, isBefore, addDays, parseISO, isValid } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    html2canvas: any
    jspdf: any
  }
}

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
  const { user } = useAuth()
  const { toast } = useToast()
  const location = useLocation()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [itinerary, setItinerary] = useState<ItinerarioEvent[]>([])
  const [orcamentos, setOrcamentos] = useState<OrcamentoPlanejado[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [documents, setDocuments] = useState<Documento[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [autoExported, setAutoExported] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [tripData, travelersData, itineraryData, orcs, desps, docs, ticks, resvs] =
        await Promise.all([
          getTrip(id),
          getTravelers(id),
          getItinerarioByTrip(id),
          getOrcamentos(id),
          getDespesas(id),
          getTripDocuments(id),
          getTickets(id),
          getReservas(id),
        ])

      setTrip(tripData)
      setTravelers(travelersData)
      setItinerary(itineraryData)
      setOrcamentos(orcs)
      setDespesas(desps)
      setDocuments(docs)
      setTickets(ticks)
      setReservas(resvs)

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

  const targetCurrency = user?.moeda_padrao || trip?.moeda || 'BRL'

  const budgetData = useMemo(() => {
    return calculateBudgetData(orcamentos, despesas, [], [], itinerary, targetCurrency)
  }, [orcamentos, despesas, itinerary, targetCurrency])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-'
  }

  const formatCurrencyLocal = (val: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(val)
  }

  const formatAxisCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: targetCurrency,
      maximumFractionDigits: 0,
    }).format(val)
  }

  const getDocStatus = (dateStr?: string) => {
    if (!dateStr)
      return { label: 'Válido', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 }
    const exp = parseISO(dateStr)
    if (!isValid(exp))
      return { label: 'Válido', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 }

    const today = new Date()
    if (isBefore(exp, today))
      return { label: 'Expirado', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle }
    if (isBefore(exp, addDays(today, 30)))
      return {
        label: 'Próximo de expirar',
        color: 'text-orange-700',
        bg: 'bg-orange-100',
        icon: AlertTriangle,
      }

    return { label: 'Válido', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 }
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true)
      const { generatePDF } = await import('@/lib/pdf-utils')
      await generatePDF('pdf-content', `Relatorio_Viagem_${trip?.title || 'Resumo'}`)
      toast({
        title: 'Sucesso',
        description: 'Relatório gerado com sucesso!',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!loading && !error && trip && !autoExported) {
      const searchParams = new URLSearchParams(location.search)
      if (searchParams.get('export') === 'true') {
        setAutoExported(true)
        setTimeout(() => {
          handleGeneratePDF()
        }, 1500)
      }
    }
  }, [loading, error, trip, autoExported, location.search])

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
  const totalPercent = totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0
  const isOverBudget = totalRealized > totalPlanned

  return (
    <div className="container py-8 px-4 max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 print:py-0 print:pb-0 print:px-0 print:max-w-none print:w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 print:hidden">
        <div>
          <Button variant="ghost" className="mb-2 -ml-4 text-slate-500" asChild>
            <Link to={`/trips/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="print-hidden">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={handleGeneratePDF} disabled={isGenerating} className="print-hidden">
            <FileText className="mr-2 h-4 w-4" />{' '}
            {isGenerating ? 'Gerando...' : 'Exportar Relatório'}
          </Button>
        </div>
      </div>

      <div
        id="pdf-content"
        className="bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-slate-200 max-w-full space-y-10 overflow-hidden text-slate-900 print:border-none print:shadow-none print:p-0 print:overflow-visible"
      >
        {/* PDF Header */}
        <div className="border-b border-slate-200 pb-6 break-inside-avoid">
          <h1 className="text-2xl font-bold text-slate-800">{trip.title}</h1>
          <p className="text-sm text-slate-500">{trip.destination}</p>
        </div>

        {/* Section 1: Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 break-inside-avoid">
          <Card className="shadow-none border-slate-200 break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">Período</CardTitle>
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

          <Card className="shadow-none border-slate-200 break-inside-avoid">
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
                {travelers.length > 0 ? travelers.map((t) => t.nome).join(', ') : 'Nenhum'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none border-slate-200 break-inside-avoid">
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

          <Card className="shadow-none border-slate-200 break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">Emissão</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{format(new Date(), 'dd/MM/yyyy')}</div>
              <p className="text-xs text-slate-500 mt-1">Data de geração</p>
            </CardContent>
          </Card>
        </section>

        {trip.descricao && (
          <section className="space-y-2 break-inside-avoid">
            <h2 className="text-xl font-semibold border-b border-slate-200 pb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-slate-500" />
              Descrição da Viagem
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap">{trip.descricao}</p>
          </section>
        )}

        {/* Section Transportes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2 flex items-center gap-2 break-after-avoid">
            <Plane className="h-5 w-5 text-slate-500" />
            Transporte
          </h2>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Nenhum transporte registrado
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Companhia</TableHead>
                    <TableHead>Origem ➔ Destino</TableHead>
                    <TableHead>Partida</TableHead>
                    <TableHead>Chegada</TableHead>
                    <TableHead>Confirmação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id} className="break-inside-avoid">
                      <TableCell className="capitalize font-medium text-slate-700">
                        {t.tipo}
                      </TableCell>
                      <TableCell>{t.companhia || '-'}</TableCell>
                      <TableCell>
                        {t.origem || '-'} {t.destino ? `➔ ${t.destino}` : ''}
                      </TableCell>
                      <TableCell>
                        {formatDate(t.data_saida)} {t.hora_saida || ''}
                      </TableCell>
                      <TableCell>
                        {formatDate(t.data_chegada)} {t.hora_chegada || ''}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {t.numero_confirmacao || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Section Reservas */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2 flex items-center gap-2 break-after-avoid">
            <Bed className="h-5 w-5 text-slate-500" />
            Acomodação & Refeições
          </h2>
          {reservas.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Nenhuma reserva registrada
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome/Local</TableHead>
                    <TableHead>Check-in / Data</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Confirmação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservas.map((r) => (
                    <TableRow key={r.id} className="break-inside-avoid">
                      <TableCell className="capitalize font-medium text-slate-700">
                        {r.tipo}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.nome}</div>
                        {r.local && <div className="text-xs text-slate-500">{r.local}</div>}
                      </TableCell>
                      <TableCell>
                        {formatDate(r.data_checkin)} {r.hora_checkin || ''}
                      </TableCell>
                      <TableCell>
                        {r.data_checkout
                          ? `${formatDate(r.data_checkout)} ${r.hora_checkout || ''}`
                          : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.numero_confirmacao || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Section Itinerary */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2 flex items-center gap-2 break-after-avoid">
            <MapPin className="h-5 w-5 text-slate-500" />
            Itinerário
          </h2>
          {itinerary.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Nenhuma atividade registrada
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itinerary.map((ev) => {
                    const isDone = isBefore(parseISO(ev.data), new Date())
                    return (
                      <TableRow key={ev.id} className="break-inside-avoid">
                        <TableCell className="whitespace-nowrap font-medium text-slate-700">
                          {formatDate(ev.data)}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {ev.hora_inicio || '-'} {ev.hora_fim ? `às ${ev.hora_fim}` : ''}
                        </TableCell>
                        <TableCell className="font-medium">{ev.atividade}</TableCell>
                        <TableCell className="text-slate-600">{ev.local || '-'}</TableCell>
                        <TableCell
                          className="text-slate-600 text-sm max-w-[200px] truncate"
                          title={ev.notas}
                        >
                          {ev.notas || '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              isDone ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
                            )}
                          >
                            {isDone ? 'Concluído' : 'Pendente'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Section Budget */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2 flex items-center gap-2 break-after-avoid">
            <AlertCircle className="h-5 w-5 text-slate-500" />
            Comparativo de Orçamento ({targetCurrency})
          </h2>
          {isOverBudget && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-start gap-3 border border-red-200 break-inside-avoid">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Atenção: Orçamento Excedido</h4>
                <p className="text-sm mt-1">
                  O total realizado superou o valor planejado em{' '}
                  <span className="font-bold">
                    {formatCurrencyLocal(Math.abs(totalDiff), targetCurrency)}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start break-inside-avoid">
            <div className="border border-slate-200 rounded-lg overflow-x-auto break-inside-avoid">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Planejado</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead className="text-right">% Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetData.map((cat) => (
                    <TableRow key={cat.category} className="break-inside-avoid">
                      <TableCell className="capitalize font-medium">{cat.category}</TableCell>
                      <TableCell className="text-right text-slate-600">
                        {formatCurrencyLocal(cat.planned, targetCurrency)}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {formatCurrencyLocal(cat.realized, targetCurrency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${cat.diff < 0 ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {formatCurrencyLocal(cat.diff, targetCurrency)}
                      </TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {cat.percent.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-slate-50 break-inside-avoid">
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrencyLocal(totalPlanned, targetCurrency)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrencyLocal(totalRealized, targetCurrency)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${totalDiff < 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {formatCurrencyLocal(totalDiff, targetCurrency)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {totalPercent.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <Card className="shadow-none border border-slate-200 break-inside-avoid">
              <CardContent className="pt-6">
                {totalPlanned === 0 && totalRealized === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    Nenhuma despesa registrada
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={budgetData} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        className="capitalize text-xs font-medium"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatAxisCurrency}
                        width={80}
                        className="text-xs font-medium text-slate-600"
                      />
                      <ChartTooltip
                        cursor={{ fill: '#f1f5f9' }}
                        content={<ChartTooltipContent />}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="planned"
                        fill="var(--color-planned)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="realized"
                        fill="var(--color-realized)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section Documents */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2 flex items-center gap-2 break-after-avoid">
            <FileText className="h-5 w-5 text-slate-500" />
            Documentos
          </h2>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Nenhum documento registrado
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const status = getDocStatus(doc.data_expiracao)
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={doc.id} className="break-inside-avoid">
                        <TableCell className="font-medium">{doc.nome_arquivo}</TableCell>
                        <TableCell className="capitalize text-slate-600">
                          {doc.tipo || 'Outro'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatDate(doc.data_expiracao)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Footer Signature */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 break-inside-avoid">
          <p>
            Gerado por{' '}
            <span className="font-medium text-slate-700">
              {user?.name || user?.email || 'Usuário'}
            </span>{' '}
            em {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
          <p className="font-medium">TripFlow &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
