import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getItinerarioByTrip, deleteItinerario, ItinerarioEvent } from '@/services/itinerario'
import { getComentario } from '@/services/comentarios'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Plus, LayoutGrid, List, AlertTriangle, Printer } from 'lucide-react'
import { format, parseISO, isSameDay, eachDayOfInterval, addDays, startOfDay } from 'date-fns'
import {
  getIntegracaoGoogleCalendar,
  saveIntegracaoGoogleCalendar,
  type IntegracaoGoogleCalendar,
} from '@/services/integracao_google_calendar'
import pb from '@/lib/pocketbase/client'

const GoogleCalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 2v2h-8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-1V2h-2zm2 18H6V9h12v11z"
      fill="currentColor"
    />
  </svg>
)
import { ptBR } from 'date-fns/locale'

import { ActivityModal } from '@/components/itinerary/ActivityModal'
import { TimelineView } from '@/components/itinerary/TimelineView'
import { WeeklyGrid } from '@/components/itinerary/WeeklyGrid'

export default function TripItinerary() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [events, setEvents] = useState<ItinerarioEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { user } = useAuth()
  const [eventToEdit, setEventToEdit] = useState<ItinerarioEvent | null>(null)
  const [eventToDelete, setEventToDelete] = useState<ItinerarioEvent | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [googleIntegration, setGoogleIntegration] = useState<IntegracaoGoogleCalendar | null>(null)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      getIntegracaoGoogleCalendar(user.id).then(setGoogleIntegration)
    }
  }, [user])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'google-calendar-connected') {
        toast({ title: 'Google Calendar conectado com sucesso!' })
        if (user) {
          getIntegracaoGoogleCalendar(user.id).then(setGoogleIntegration)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [user, toast])

  const handleConnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true)
      const res = await pb.send('/backend/v1/google-calendar/auth-url', { method: 'GET' })
      if (res.url) {
        const width = 500
        const height = 600
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2
        window.open(
          res.url,
          'GoogleAuth',
          `width=${width},height=${height},top=${top},left=${left}`,
        )
      }
    } catch (err) {
      toast({ title: 'Erro ao iniciar conexão com Google', variant: 'destructive' })
    } finally {
      setIsConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!user) return
    try {
      await saveIntegracaoGoogleCalendar(user.id, {
        conectado: false,
        token_acesso: '',
        token_refresh: '',
      })
      setGoogleIntegration((prev) =>
        prev ? { ...prev, conectado: false, token_acesso: '', token_refresh: '' } : null,
      )
      toast({ title: 'Google Calendar desconectado' })
      setIsDisconnectDialogOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao desconectar', variant: 'destructive' })
    }
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      const { generatePDF } = await import('@/lib/pdf-utils')
      await generatePDF('pdf-content', `Relatorio_Viagem_${trip?.title || 'Itinerario'}`)
      toast({ title: 'PDF gerado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const loadData = async () => {
    if (!id) return
    setError(false)
    try {
      const tripData = await getTrip(id)
      setTrip(tripData)
      const eventsData = await getItinerarioByTrip(id)
      setEvents(eventsData)

      // Initialize selected date on first load
      if (loading && tripData.start_date) {
        const startDate = parseISO(tripData.start_date)
        setSelectedDate(startDate)
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('itinerario', (e) => {
    if (e.record.viagem_id === id) loadData()
  })

  useRealtime('comentarios', async (e) => {
    if (e.action === 'create' && e.record.viagem_id === id) {
      if (user && e.record.usuario_id !== user.id) {
        const activity = events.find((ev) => ev.id === e.record.atividade_id)
        if (activity) {
          try {
            const comment = await getComentario(e.record.id)
            const userName = comment.expand?.usuario_id?.name || 'Alguém'
            toast({
              title: `${userName} comentou em ${activity.atividade}`,
              duration: 5000,
            })
          } catch (err) {
            toast({
              title: `Novo comentário em ${activity.atividade}`,
              duration: 5000,
            })
          }
        }
      }
    }
  })

  const handleDelete = async () => {
    if (!eventToDelete) return
    try {
      await deleteItinerario(eventToDelete.id)
      toast({ title: 'Atividade deletada.' })
    } catch (err) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    } finally {
      setEventToDelete(null)
    }
  }

  const allTripDays = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return []
    try {
      return eachDayOfInterval({
        start: parseISO(trip.start_date),
        end: parseISO(trip.end_date),
      })
    } catch (e) {
      return []
    }
  }, [trip])

  const weeklyDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(selectedDate, i))
  }, [selectedDate])

  const dailyEvents = useMemo(() => {
    return events.filter((e) => isSameDay(new Date(e.data.substring(0, 10)), selectedDate))
  }, [events, selectedDate])

  if (loading) {
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-8">
          <Skeleton className="h-80 w-80 hidden lg:block" />
          <Skeleton className="h-96 flex-1" />
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="container py-20 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h2>
        <p className="text-slate-500 mb-6">Não foi possível carregar o itinerário desta viagem.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div
      id="pdf-content"
      className="container py-8 px-4 animate-fade-in flex flex-col gap-6 h-full bg-slate-50"
    >
      {/* Header */}
      <div className="print-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" className="-ml-4 text-slate-500" asChild>
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2 items-center">
          {googleIntegration?.conectado ? (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsDisconnectDialogOpen(true)}
            >
              <GoogleCalendarIcon className="w-4 h-4 mr-2" />
              Desconectar Google Calendar
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="bg-slate-200 hover:bg-slate-300 text-slate-800"
              onClick={handleConnectGoogle}
              disabled={isConnectingGoogle}
            >
              <GoogleCalendarIcon className="w-4 h-4 mr-2" />
              Conectar Google Calendar
            </Button>
          )}
          <Button onClick={handleGeneratePDF} variant="outline" disabled={isGeneratingPDF}>
            <Printer className="h-4 w-4 mr-2" /> {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </div>
      </div>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Itinerário de {trip.title}
          </h1>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto print-hidden">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setViewMode('daily')}
            >
              <List className="w-4 h-4 mr-2" /> Diário
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setViewMode('weekly')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Semanal
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Sidebar Desktop Calendar */}
        <div className="hidden lg:block w-[280px] shrink-0 print-hidden">
          <div className="bg-white p-3 rounded-lg border shadow-sm sticky top-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={ptBR}
              className="w-full"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Mobile/Tablet Date Selector */}
          <div className="lg:hidden print-hidden">
            <ScrollArea className="w-full whitespace-nowrap bg-white border rounded-lg shadow-sm">
              <div className="flex w-max space-x-1 p-2">
                {allTripDays.map((day) => (
                  <Button
                    key={day.toISOString()}
                    variant={isSameDay(day, selectedDate) ? 'default' : 'ghost'}
                    onClick={() => setSelectedDate(day)}
                    className="flex-col h-auto py-2 px-4 rounded-md min-w-[70px]"
                  >
                    <span className="text-xs font-normal opacity-80 capitalize">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className="text-lg font-bold">{format(day, 'dd')}</span>
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
              {viewMode === 'weekly' && (
                <p className="text-sm text-slate-500">Exibindo próximos 7 dias</p>
              )}
            </div>
            <Button className="print-hidden" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Adicionar Atividade</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>

          {/* Views */}
          <div className="flex-1 bg-white p-4 sm:p-6 rounded-lg border shadow-sm print-hidden">
            {viewMode === 'daily' ? (
              <TimelineView
                events={dailyEvents}
                onEdit={setEventToEdit}
                onDelete={setEventToDelete}
                onAdd={() => setIsAddModalOpen(true)}
              />
            ) : (
              <WeeklyGrid
                days={weeklyDays}
                events={events}
                onDayClick={(d) => {
                  setSelectedDate(d)
                  setViewMode('daily')
                }}
              />
            )}
          </div>

          {/* Print Only Full Itinerary */}
          <div className="hidden print-only mt-8">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Itinerário Completo</h2>
            <div className="space-y-6">
              {allTripDays.map((day) => {
                const dayEvents = events.filter((e) =>
                  isSameDay(new Date(e.data.substring(0, 10)), day),
                )
                if (dayEvents.length === 0) return null

                // Sort by time
                dayEvents.sort((a, b) =>
                  (a.hora_inicio || '24:00').localeCompare(b.hora_inicio || '24:00'),
                )

                return (
                  <div key={day.toISOString()} className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-100 p-3 font-bold border-b">
                      {format(day, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white border-b">
                        <tr>
                          <th className="p-3 w-24">Horário</th>
                          <th className="p-3">Atividade</th>
                          <th className="p-3">Local</th>
                          <th className="p-3">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {dayEvents.map((ev) => (
                          <tr key={ev.id}>
                            <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                              {ev.hora_inicio || '--:--'} {ev.hora_fim ? `às ${ev.hora_fim}` : ''}
                            </td>
                            <td className="p-3 font-semibold">{ev.atividade}</td>
                            <td className="p-3 text-slate-600">{ev.local || '-'}</td>
                            <td className="p-3 capitalize text-slate-600">{ev.tipo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
              {events.length === 0 && (
                <p className="text-slate-500">Nenhuma atividade programada para esta viagem.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActivityModal
        isOpen={isAddModalOpen || !!eventToEdit}
        onClose={() => {
          setIsAddModalOpen(false)
          setEventToEdit(null)
        }}
        onSaved={loadData}
        tripId={trip.id}
        selectedDate={selectedDate}
        initialData={eventToEdit}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(o) => !o && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta atividade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>
              Sim, deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Google Calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desconectar o Google Calendar? Suas atividades deixarão de ser
              sincronizadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDisconnectGoogle}
            >
              Sim, desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
