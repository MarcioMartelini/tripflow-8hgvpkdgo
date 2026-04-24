import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import {
  getItinerarioByTrip,
  deleteItinerario,
  updateItinerario,
  ItinerarioEvent,
} from '@/services/itinerario'
import { getComentario } from '@/services/comentarios'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  AlertTriangle,
  Printer,
  Map as MapIcon,
  Navigation,
} from 'lucide-react'
import { format, isSameDay, eachDayOfInterval, addDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ActivityModal } from '@/components/itinerary/ActivityModal'
import { TimelineView } from '@/components/itinerary/TimelineView'
import { WeeklyGrid } from '@/components/itinerary/WeeklyGrid'
import { MapView } from '@/components/itinerary/MapView'
import pb from '@/lib/pocketbase/client'
import { PdfViewerDialog } from '@/components/PdfViewerDialog'

export default function TripItinerary() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [events, setEvents] = useState<ItinerarioEvent[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'map'>('daily')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { user } = useAuth()
  const [eventToEdit, setEventToEdit] = useState<ItinerarioEvent | null>(null)
  const [eventToDelete, setEventToDelete] = useState<ItinerarioEvent | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null)

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const CATEGORIES = [
    { id: 'hospedagem', label: 'Hospedagem' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'alimentação', label: 'Alimentação' },
    { id: 'atividade', label: 'Atividade' },
    { id: 'compras', label: 'Compras' },
    { id: 'outro', label: 'Outro' },
  ]

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
      const [tripData, eventsData, ticketsData, reservasData] = await Promise.all([
        getTrip(id),
        getItinerarioByTrip(id),
        pb.collection('tickets').getFullList({ filter: `viagem_id="${id}"` }),
        pb.collection('reservas').getFullList({ filter: `viagem_id="${id}"` }),
      ])
      setTrip(tripData)
      setEvents(eventsData)
      setTickets(ticketsData)
      setReservas(reservasData)

      // Initialize selected date on first load
      if (loading && tripData.start_date) {
        const startString = tripData.start_date.substring(0, 10) + 'T12:00:00'
        setSelectedDate(new Date(startString))
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleSyncCompleted = () => loadData()
    window.addEventListener('sync-completed', handleSyncCompleted)
    return () => window.removeEventListener('sync-completed', handleSyncCompleted)
  }, [id])

  useRealtime('itinerario', (e) => {
    if (e.record.viagem_id === id) loadData()
  })
  useRealtime('tickets', (e) => {
    if (e.record.viagem_id === id) loadData()
  })
  useRealtime('reservas', (e) => {
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
      const startString = trip.start_date.substring(0, 10) + 'T12:00:00'
      const endString = trip.end_date.substring(0, 10) + 'T12:00:00'
      return eachDayOfInterval({
        start: new Date(startString),
        end: new Date(endString),
      })
    } catch (e) {
      return []
    }
  }, [trip])

  const weeklyDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(selectedDate, i))
  }, [selectedDate])

  const allCombinedEvents = useMemo(() => {
    const itinerarioEvents = events.map((e) => ({ ...e, _source: 'itinerario' }))

    const mappedTickets = tickets.map((t) => ({
      id: t.id,
      viagem_id: t.viagem_id,
      data: t.data_saida || t.created,
      hora_inicio: t.hora_saida || '',
      hora_fim: t.hora_chegada || '',
      atividade: `Passagem: ${t.origem || 'Origem'} ➔ ${t.destino || 'Destino'}`,
      tipo: t.tipo,
      local: t.companhia || '',
      notas: `Confirmação: ${t.numero_confirmacao || '-'}`,
      arquivos: t.arquivo,
      categoria: 'transporte',
      _source: 'tickets',
      _original: t,
    }))

    const mappedReservas = reservas.map((r) => ({
      id: r.id,
      viagem_id: r.viagem_id,
      data: r.data_checkin || r.created,
      hora_inicio: r.hora_checkin || '',
      hora_fim: r.hora_checkout || '',
      atividade: `Reserva: ${r.nome}`,
      tipo: r.tipo,
      local: r.local || '',
      notas: `Confirmação: ${r.numero_confirmacao || '-'}`,
      arquivos: r.arquivo,
      categoria:
        r.tipo === 'hotel'
          ? 'hospedagem'
          : r.tipo === 'restaurante'
            ? 'alimentação'
            : r.tipo === 'atividade'
              ? 'atividade'
              : 'outro',
      _source: 'reservas',
      _original: r,
    }))

    return [...itinerarioEvents, ...mappedTickets, ...mappedReservas] as ItinerarioEvent[]
  }, [events, tickets, reservas])

  const dailyEvents = useMemo(() => {
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd')
    return allCombinedEvents
      .filter((e) => (e.data || '').substring(0, 10) === selectedDateString)
      .sort((a, b) => (a.hora_inicio || '24:00').localeCompare(b.hora_inicio || '24:00'))
  }, [allCombinedEvents, selectedDate])

  const filteredDailyEvents = useMemo(() => {
    let filtered = dailyEvents
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((e) => selectedCategories.includes(e.categoria || 'outro'))
    }
    return filtered
  }, [dailyEvents, selectedCategories])

  const handleNavigate = () => {
    const eventsWithCoords = filteredDailyEvents
      .filter((e) => e.latitude && e.longitude)
      .sort((a, b) => (a.hora_inicio || '24:00').localeCompare(b.hora_inicio || '24:00'))

    if (eventsWithCoords.length === 0) {
      toast({ title: 'Nenhum local com coordenadas para navegar.', variant: 'destructive' })
      return
    }

    const mode = eventsWithCoords[0]?.meio_transporte || 'carro'
    let travelmode = 'driving'
    if (mode === 'andando') travelmode = 'walking'
    if (mode === 'transporte_publico') travelmode = 'transit'
    if (mode === 'bicicleta') travelmode = 'bicycling'

    if (eventsWithCoords.length === 1) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${eventsWithCoords[0].latitude},${eventsWithCoords[0].longitude}&travelmode=${travelmode}&dir_action=navigate`,
        '_blank',
      )
      return
    }

    const origin = `${eventsWithCoords[0].latitude},${eventsWithCoords[0].longitude}`
    const destination = `${eventsWithCoords[eventsWithCoords.length - 1].latitude},${eventsWithCoords[eventsWithCoords.length - 1].longitude}`

    const waypoints = eventsWithCoords
      .slice(1, -1)
      .map((e) => `${e.latitude},${e.longitude}`)
      .join('|')

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=${travelmode}&dir_action=navigate`
    window.open(url, '_blank')
  }

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
          <Tabs
            value={viewMode}
            onValueChange={(v: any) => setViewMode(v)}
            className="w-full sm:w-auto print-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto">
              <TabsTrigger value="daily" className="flex items-center gap-1.5 sm:gap-2">
                <List className="w-4 h-4" />{' '}
                <span className="text-xs sm:text-sm hidden sm:inline">Lista</span>
                <span className="text-xs sm:hidden">Lista de Atividades</span>
              </TabsTrigger>
              <TabsTrigger
                value="weekly"
                className="flex items-center gap-1.5 sm:gap-2 hidden sm:flex"
              >
                <LayoutGrid className="w-4 h-4" />{' '}
                <span className="text-xs sm:text-sm">Semanal</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-1.5 sm:gap-2">
                <MapIcon className="w-4 h-4" /> <span className="text-xs sm:text-sm">Mapa</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Sidebar Desktop Calendar */}
        <div className={cn('hidden lg:block w-[280px] shrink-0 print-hidden')}>
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
          <div className={cn('lg:hidden print-hidden')}>
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
          <div
            className={cn(
              'flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-lg border shadow-sm gap-4 sm:gap-0',
            )}
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
              {viewMode === 'weekly' && (
                <p className="text-sm text-slate-500">Exibindo próximos 7 dias</p>
              )}
              {viewMode === 'map' && <p className="text-sm text-slate-500">Visualização no Mapa</p>}
            </div>
            <div className="flex gap-2 print-hidden w-full sm:w-auto">
              {(viewMode === 'daily' || viewMode === 'map') && (
                <Button
                  variant="secondary"
                  onClick={handleNavigate}
                  className="flex-1 sm:flex-none"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navegar
                </Button>
              )}
              <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Atividade</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          {(viewMode === 'daily' || viewMode === 'map') && (
            <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm print-hidden flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-slate-500 mr-1">Filtros:</span>
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id],
                    )
                  }}
                >
                  {cat.label}
                </Badge>
              ))}
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  className="h-6 px-2 text-xs ml-auto text-slate-500 hover:text-slate-900"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          )}

          {/* Views */}
          <div className="flex-1 bg-white p-4 sm:p-6 rounded-lg border shadow-sm print-hidden z-0">
            {viewMode === 'daily' && (
              <TimelineView
                events={filteredDailyEvents}
                onEdit={setEventToEdit}
                onDelete={setEventToDelete}
                onAdd={() => setIsAddModalOpen(true)}
                onPreview={(url: string, title: string) => {
                  const finalUrl = url.includes('token=')
                    ? url
                    : `${url}${url.includes('?') ? '&' : '?'}token=${pb.authStore.token}`
                  setPreviewFile({ url: finalUrl, title })
                }}
                onUpdateEvent={async (id, data) => {
                  setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)))
                  await updateItinerario(id, data)
                }}
                onUpdateAllEvents={async (ids, data) => {
                  setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? { ...e, ...data } : e)))
                  await Promise.all(ids.map((id) => updateItinerario(id, data)))
                }}
              />
            )}
            {viewMode === 'weekly' && (
              <WeeklyGrid
                days={weeklyDays}
                events={allCombinedEvents}
                onDayClick={(d) => {
                  setSelectedDate(d)
                  setViewMode('daily')
                }}
                onPreview={(url: string, title: string) => {
                  const finalUrl = url.includes('token=')
                    ? url
                    : `${url}${url.includes('?') ? '&' : '?'}token=${pb.authStore.token}`
                  setPreviewFile({ url: finalUrl, title })
                }}
              />
            )}
            {viewMode === 'map' && (
              <MapView
                events={filteredDailyEvents}
                trip={trip}
                onEditEvent={setEventToEdit}
                onPreview={(url: string, title: string) => {
                  const finalUrl = url.includes('token=')
                    ? url
                    : `${url}${url.includes('?') ? '&' : '?'}token=${pb.authStore.token}`
                  setPreviewFile({ url: finalUrl, title })
                }}
                onUpdateEvent={async (id, data) => {
                  setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)))
                  await updateItinerario(id, data)
                }}
                onUpdateAllEvents={async (ids, data) => {
                  setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? { ...e, ...data } : e)))
                  await Promise.all(ids.map((id) => updateItinerario(id, data)))
                }}
              />
            )}
          </div>

          {/* Print Only Full Itinerary */}
          <div className="hidden print-only mt-8">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Itinerário Completo</h2>
            <div className="space-y-6">
              {allTripDays.map((day) => {
                const dayString = format(day, 'yyyy-MM-dd')
                const dayEvents = allCombinedEvents.filter(
                  (e) => (e.data || '').substring(0, 10) === dayString,
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
              {allCombinedEvents.length === 0 && (
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
        onPreview={(url, title) => {
          const finalUrl = url.includes('token=')
            ? url
            : `${url}${url.includes('?') ? '&' : '?'}token=${pb.authStore.token}`
          setPreviewFile({ url: finalUrl, title })
        }}
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

      <PdfViewerDialog
        url={previewFile?.url || null}
        title={previewFile?.title || ''}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}
