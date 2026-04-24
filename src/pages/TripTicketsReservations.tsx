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
import {
  ArrowLeft,
  Ticket as TicketIcon,
  CalendarDays,
  AlertCircle,
  Plus,
  Download,
  Loader2,
  Printer,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
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

  const [downloadingAll, setDownloadingAll] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      const { generatePDF } = await import('@/lib/pdf-utils')
      await generatePDF('pdf-content', `Relatorio_Viagem_${trip?.title || 'Logistica'}`)
      toast({ title: 'PDF gerado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

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

  const handleDownloadAll = async () => {
    if (!tripId) return
    setDownloadingAll(true)
    try {
      const tripFiles: { url: string; name: string }[] = []

      // 1. Tickets
      const tks = await pb.collection('tickets').getFullList({ filter: `viagem_id = "${tripId}"` })
      for (const t of tks) {
        const files = t.arquivo ? (Array.isArray(t.arquivo) ? t.arquivo : [t.arquivo]) : []
        files.forEach((f, i) => {
          tripFiles.push({
            url: pb.files.getURL(t, f, { token: pb.authStore.token }),
            name: `Ticket_${t.tipo}_${t.id}_${i}.pdf`,
          })
        })
      }

      // 2. Reservas
      const rsv = await pb.collection('reservas').getFullList({ filter: `viagem_id = "${tripId}"` })
      for (const r of rsv) {
        const files = r.arquivo ? (Array.isArray(r.arquivo) ? r.arquivo : [r.arquivo]) : []
        files.forEach((f, i) => {
          tripFiles.push({
            url: pb.files.getURL(r, f, { token: pb.authStore.token }),
            name: `Reserva_${r.tipo}_${r.id}_${i}.pdf`,
          })
        })
      }

      // 3. Itinerario
      const iti = await pb
        .collection('itinerario')
        .getFullList({ filter: `viagem_id = "${tripId}"` })
      for (const it of iti) {
        const files = it.arquivos ? (Array.isArray(it.arquivos) ? it.arquivos : [it.arquivos]) : []
        files.forEach((f, i) => {
          tripFiles.push({
            url: pb.files.getURL(it, f, { token: pb.authStore.token }),
            name: `Itinerario_${it.tipo}_${it.id}_${i}.pdf`,
          })
        })
      }

      // 4. Despesas
      const des = await pb.collection('despesas').getFullList({ filter: `viagem_id = "${tripId}"` })
      for (const d of des) {
        const files = d.arquivos ? (Array.isArray(d.arquivos) ? d.arquivos : [d.arquivos]) : []
        files.forEach((f, i) => {
          tripFiles.push({
            url: pb.files.getURL(d, f, { token: pb.authStore.token }),
            name: `Despesa_${d.categoria}_${d.id}_${i}.pdf`,
          })
        })
      }

      // 5. Documentos
      const doc = await pb
        .collection('documentos')
        .getFullList({ filter: `viagem_id = "${tripId}"` })
      for (const d of doc) {
        if (d.arquivo) {
          tripFiles.push({
            url: pb.files.getURL(d, d.arquivo, { token: pb.authStore.token }),
            name: `Documento_${d.tipo}_${d.id}.pdf`,
          })
        }
      }
      if (tripFiles.length === 0) {
        toast({ title: 'Nenhum documento encontrado para esta viagem.', variant: 'destructive' })
        setDownloadingAll(false)
        return
      }

      toast({ title: `Baixando ${tripFiles.length} documentos...` })

      for (const file of tripFiles) {
        const a = document.createElement('a')
        a.href = file.url
        a.target = '_blank'
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        await new Promise((r) => setTimeout(r, 500)) // 500ms delay between files
      }

      toast({ title: 'Downloads iniciados com sucesso!' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao baixar documentos.', variant: 'destructive' })
    } finally {
      setDownloadingAll(false)
    }
  }

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
        {type === 'tickets' ? 'Nenhum ticket adicionado' : 'Nenhuma reserva adicionada'}
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
    <div id="pdf-content" className="container py-8 px-4 animate-fade-in space-y-6 bg-slate-50">
      <div className="print-hidden">
        <Button variant="ghost" className="mb-4 -ml-4 text-slate-500" asChild>
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tickets e Reservas</h1>
          <p className="text-slate-500 mt-1">{trip.title}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print-hidden">
          <TabsList>
            <TabsTrigger value="tickets" className="px-6">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="reservas" className="px-6">
              Reservas
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="shrink-0"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Gerar PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="shrink-0"
            >
              {downloadingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingAll ? 'Baixando...' : 'Baixar Comprovantes'}
            </Button>

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

        <div className="print-hidden">
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
        </div>
      </Tabs>

      <div className="hidden print-only space-y-8">
        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">Tickets de Transporte</h2>
          {tickets.length === 0 ? (
            <p className="text-slate-500">Nenhum ticket registrado.</p>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Tipo</th>
                    <th className="p-3 font-semibold">Origem - Destino</th>
                    <th className="p-3 font-semibold">Saída</th>
                    <th className="p-3 font-semibold">Chegada</th>
                    <th className="p-3 font-semibold">Confirmação</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="p-3 capitalize">{t.tipo}</td>
                      <td className="p-3">
                        {t.origem || '-'} <br />
                        &rarr; {t.destino || '-'}
                      </td>
                      <td className="p-3">
                        {t.data_saida ? new Date(t.data_saida).toLocaleDateString('pt-BR') : '-'}{' '}
                        {t.hora_saida}
                      </td>
                      <td className="p-3">
                        {t.data_chegada
                          ? new Date(t.data_chegada).toLocaleDateString('pt-BR')
                          : '-'}{' '}
                        {t.hora_chegada}
                      </td>
                      <td className="p-3">{t.numero_confirmacao || '-'}</td>
                      <td className="p-3 capitalize">{t.status || 'pendente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">
            Reservas (Hospedagem / Atividades)
          </h2>
          {reservas.length === 0 ? (
            <p className="text-slate-500">Nenhuma reserva registrada.</p>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Tipo</th>
                    <th className="p-3 font-semibold">Nome / Local</th>
                    <th className="p-3 font-semibold">Check-in</th>
                    <th className="p-3 font-semibold">Check-out</th>
                    <th className="p-3 font-semibold">Confirmação</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reservas.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 capitalize">{r.tipo}</td>
                      <td className="p-3 font-medium">
                        {r.nome}
                        <br />
                        <span className="font-normal text-slate-500">{r.local}</span>
                      </td>
                      <td className="p-3">
                        {r.data_checkin
                          ? new Date(r.data_checkin).toLocaleDateString('pt-BR')
                          : '-'}{' '}
                        {r.hora_checkin}
                      </td>
                      <td className="p-3">
                        {r.data_checkout
                          ? new Date(r.data_checkout).toLocaleDateString('pt-BR')
                          : '-'}{' '}
                        {r.hora_checkout}
                      </td>
                      <td className="p-3">{r.numero_confirmacao || '-'}</td>
                      <td className="p-3 capitalize">{r.status || 'pendente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
