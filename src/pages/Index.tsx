import { useEffect, useState } from 'react'
import { getTrips, type Trip } from '@/services/trips'
import { getUpcomingItinerario, type ItinerarioEvent } from '@/services/itinerario'
import { getDocumentosCount } from '@/services/documentos'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  MapPin,
  Plane,
  Briefcase,
  DollarSign,
  FileText,
  Users,
  ChevronRight,
  Activity,
  Building,
  Map,
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { NewTripDialog } from '@/components/NewTripDialog'

export default function Index() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [events, setEvents] = useState<ItinerarioEvent[]>([])
  const [docCount, setDocCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [tripsData, eventsData, docs] = await Promise.all([
        getTrips(),
        getUpcomingItinerario(),
        getDocumentosCount(),
      ])
      setTrips(tripsData)
      setEvents(eventsData.items)
      setDocCount(docs)
    } catch (e: any) {
      console.error(e)
      setError('Ocorreu um erro ao carregar seus dados. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('trips', () => loadData())
  useRealtime('itinerario', () => loadData())

  const activeTrips = trips
    .filter((t) => t.status === 'ongoing' || t.status === 'planned')
    .sort((a, b) => {
      if (a.status === 'ongoing' && b.status !== 'ongoing') return -1
      if (b.status === 'ongoing' && a.status !== 'ongoing') return 1
      const aDate = a.data_inicio || a.start_date || ''
      const bDate = b.data_inicio || b.start_date || ''
      const aTime = aDate ? new Date(aDate).getTime() : NaN
      const bTime = bDate ? new Date(bDate).getTime() : NaN
      return (Number.isNaN(aTime) ? Infinity : aTime) - (Number.isNaN(bTime) ? Infinity : bTime)
    })
    .slice(0, 3)

  const totalBudget = trips.reduce(
    (acc, trip) => acc + (trip.orcamento_planejado || trip.budget_total || 0),
    0,
  )

  const totalDocuments = docCount

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'voo':
        return <Plane className="h-4 w-4" />
      case 'hotel':
        return <Building className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  if (error) {
    return (
      <div className="container py-12 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[50vh] animate-fade-in-up">
        <Activity className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops, algo deu errado!</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">{error}</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto space-y-10 animate-fade-in-up">
      {/* Hero Welcome Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 md:p-12 border border-primary/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Bem-vindo ao TripFlow
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Organize suas viagens com segurança e controle total. Planeje roteiros, gerencie
            orçamentos e mantenha seus eventos sempre sob controle.
          </p>
          {trips.length === 0 ? (
            <NewTripDialog />
          ) : (
            <Button size="lg" className="gap-2" asChild>
              <Link to="/trips">
                Ver todas as viagens <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <Plane className="absolute -right-10 -bottom-10 h-64 w-64 text-primary/5 -rotate-12 pointer-events-none" />
      </section>

      {/* Quick Statistics */}
      <section className="grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total de Viagens
                </CardTitle>
                <Briefcase className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{trips.length}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Documentos Anexados
                </CardTitle>
                <FileText className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{totalDocuments}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Orçamento Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(totalBudget)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Active Trips Tracking */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Viagens Ativas</h2>
            {!loading && activeTrips.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/trips">Ver todas</Link>
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-[250px] rounded-xl" />
              ))
            ) : activeTrips.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-white border-dashed shadow-sm">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Map className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma viagem ativa</h3>
                <p className="text-slate-500 max-w-sm mb-4">
                  Você ainda não tem viagens em andamento ou planejadas.
                </p>
                <NewTripDialog />
              </div>
            ) : (
              activeTrips.map((trip) => {
                const startRaw = trip.data_inicio || trip.start_date
                const endRaw = trip.data_fim || trip.end_date
                const start = startRaw ? new Date(startRaw as string) : null
                const end = endRaw ? new Date(endRaw as string) : null
                const isStartValid = start && isValid(start)
                const isEndValid = end && isValid(end)
                const isOngoing = trip.status === 'ongoing'
                const tripTitle = trip.nome || trip.title
                const tripDest = trip.destino || trip.destination

                return (
                  <Card
                    key={trip.id}
                    className={cn(
                      'flex flex-col border-slate-200/60 transition-all hover:shadow-md',
                      isOngoing && 'border-primary/50 ring-1 ring-primary/20',
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            isOngoing
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          )}
                        >
                          {isOngoing ? 'Em andamento' : 'Planejada'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl leading-tight line-clamp-1" title={tripTitle}>
                        {tripTitle}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{tripDest}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-4 flex-1">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>
                              {isStartValid && isEndValid
                                ? `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`
                                : isStartValid
                                  ? format(start, 'dd/MM', { locale: ptBR })
                                  : isEndValid
                                    ? `Até ${format(end, 'dd/MM', { locale: ptBR })}`
                                    : 'Data não informada'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{trip.travelers_count || 1} viajantes</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-slate-500">
                            <span>Progresso</span>
                            <span>{trip.progress || 0}%</span>
                          </div>
                          <Progress value={trip.progress || 0} className="h-2" />
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 border-t border-slate-100 mt-auto p-4">
                      <Button variant="outline" className="w-full gap-2">
                        Abrir Detalhes <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Próximos Eventos</h2>

          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 h-full min-h-[300px]">
                <Calendar className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Nenhum evento próximo</p>
                <p className="text-sm text-slate-400 mt-1">Adicione atividades nas suas viagens.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map((event) => {
                  const eventDateRaw = event.date
                  const eventDate = eventDateRaw ? new Date(eventDateRaw) : null
                  const isEventDateValid = eventDate && isValid(eventDate)

                  return (
                    <div
                      key={event.id}
                      className="p-4 flex gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-12 shrink-0 border border-slate-200 rounded-lg bg-white shadow-sm py-1">
                        {isEventDateValid ? (
                          <>
                            <span className="text-xs font-bold text-primary uppercase">
                              {format(eventDate, 'MMM', { locale: ptBR })}
                            </span>
                            <span className="text-lg font-bold text-slate-700 leading-none">
                              {format(eventDate, 'dd')}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-slate-300">-</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {event.atividade}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {getEventIcon(event.type)}
                            <span className="capitalize">{event.type}</span>
                          </span>
                          <span>•</span>
                          <span>{event.hora_inicio}</span>
                          {event.expand?.viagem_id && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                {event.expand.viagem_id.nome || event.expand.viagem_id.title}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {!loading && events.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <Button variant="link" size="sm" className="text-slate-500 h-auto p-0">
                  Ver agenda completa
                </Button>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}
