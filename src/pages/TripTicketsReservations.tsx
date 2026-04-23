import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTickets, Ticket } from '@/services/tickets'
import { getReservas, Reserva } from '@/services/reservas'
import { getTrip, Trip } from '@/services/trips'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Ticket as TicketIcon, CalendarDays, AlertCircle, Plus } from 'lucide-react'
import { TicketCard } from '@/components/tickets/TicketCard'
import { ReservaCard } from '@/components/tickets/ReservaCard'
import { TicketDialog } from '@/components/tickets/TicketDialog'
import { ReservaDialog } from '@/components/tickets/ReservaDialog'

export default function TripTicketsReservations() {
  const { tripId } = useParams<{ tripId: string }>()
  const { toast } = useToast()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [activeTab, setActiveTab] = useState('tickets')
  const [statusFilter, setStatusFilter] = useState('all')

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)

  const [reservaDialogOpen, setReservaDialogOpen] = useState(false)
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null)

  const loadData = async () => {
    if (!tripId) return
    try {
      setError(false)
      const [tData, tkts, rsvs] = await Promise.all([
        getTrip(tripId),
        getTickets(tripId),
        getReservas(tripId),
      ])
      setTrip(tData)
      setTickets(tkts)
      setReservas(rsvs)
    } catch (err) {
      setError(true)
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tripId])

  useRealtime('tickets', () => loadData())
  useRealtime('reservas', () => loadData())

  const handleAddTicket = () => {
    setEditingTicket(null)
    setTicketDialogOpen(true)
  }

  const handleEditTicket = (t: Ticket) => {
    setEditingTicket(t)
    setTicketDialogOpen(true)
  }

  const handleAddReserva = () => {
    setEditingReserva(null)
    setReservaDialogOpen(true)
  }

  const handleEditReserva = (r: Reserva) => {
    setEditingReserva(r)
    setReservaDialogOpen(true)
  }

  const filteredTickets = tickets.filter((t) => statusFilter === 'all' || t.status === statusFilter)
  const filteredReservas = reservas.filter(
    (r) => statusFilter === 'all' || r.status === statusFilter,
  )

  if (loading) {
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="container py-24 px-4 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
        <p className="text-muted-foreground mb-6">
          Não foi possível carregar as informações desta viagem.
        </p>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )
  }

  const renderEmptyState = (type: 'tickets' | 'reservas') => (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 border border-dashed rounded-lg mt-6">
      {type === 'tickets' ? (
        <TicketIcon className="h-12 w-12 text-slate-300 mb-4" />
      ) : (
        <CalendarDays className="h-12 w-12 text-slate-300 mb-4" />
      )}
      <h3 className="text-lg font-medium text-slate-700">
        Nenhum {type === 'tickets' ? 'ticket' : 'reserva'} encontrado
      </h3>
      <p className="text-slate-500 mt-1 mb-6 text-center max-w-sm">
        Você ainda não adicionou{' '}
        {type === 'tickets' ? 'tickets de transporte' : 'reservas de hospedagem ou atividades'} para
        esta viagem.
      </p>
      <Button onClick={type === 'tickets' ? handleAddTicket : handleAddReserva}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar {type === 'tickets' ? 'Ticket' : 'Reserva'}
      </Button>
    </div>
  )

  return (
    <div className="container py-8 px-4 animate-fade-in space-y-6">
      <div>
        <Button variant="ghost" className="mb-4 -ml-4 text-slate-500" asChild>
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tickets e Reservas</h1>
            <p className="text-slate-500 mt-1">{trip.title}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="tickets" className="px-6">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="reservas" className="px-6">
              Reservas
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={activeTab === 'tickets' ? handleAddTicket : handleAddReserva}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'tickets' ? 'Adicionar Ticket' : 'Adicionar Reserva'}
            </Button>
          </div>
        </div>

        <TabsContent value="tickets" className="mt-0">
          {filteredTickets.length === 0 ? (
            renderEmptyState('tickets')
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((t) => (
                <TicketCard key={t.id} ticket={t} onEdit={handleEditTicket} onDelete={loadData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservas" className="mt-0">
          {filteredReservas.length === 0 ? (
            renderEmptyState('reservas')
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReservas.map((r) => (
                <ReservaCard
                  key={r.id}
                  reserva={r}
                  onEdit={handleEditReserva}
                  onDelete={loadData}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TicketDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        tripId={tripId}
        ticket={editingTicket}
        onSuccess={loadData}
      />
      <ReservaDialog
        open={reservaDialogOpen}
        onOpenChange={setReservaDialogOpen}
        tripId={tripId}
        reserva={editingReserva}
        onSuccess={loadData}
      />
    </div>
  )
}
