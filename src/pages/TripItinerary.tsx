import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getItinerarioByTrip, deleteItinerario, ItinerarioEvent } from '@/services/itinerario'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
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
  const [eventToEdit, setEventToEdit] = useState<ItinerarioEvent | null>(null)
  const [eventToDelete, setEventToDelete] = useState<ItinerarioEvent | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      const { generatePDF } = await import('@/lib/pdf-utils')
      await generatePDF('pdf-content', `Itinerario_${trip?.title || 'Viagem'}`)
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
      <div className="print-hidden flex justify-between items-center">
        <Button variant="ghost" className="-ml-4 text-slate-500" asChild>
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
          </Link>
        </Button>
        <Button onClick={handleGeneratePDF} variant="outline" disabled={isGeneratingPDF}>
          <Printer className="h-4 w-4 mr-2" /> {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
        </Button>
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
          <div className="flex-1 bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
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
    </div>
  )
}
