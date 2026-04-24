import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import { getTravelers, createTraveler, deleteTraveler, Traveler } from '@/services/travelers'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { format, parseISO, isValid } from 'date-fns'
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Mail,
  CreditCard,
  Users,
  MapPin,
  Calendar,
  Banknote,
  Map,
  FileText,
  Ticket,
  BarChart2,
  Printer,
} from 'lucide-react'

export default function TripDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [loading, setLoading] = useState(true)

  // Traveler form state
  const [openTravelerModal, setOpenTravelerModal] = useState(false)
  const [travelerLoading, setTravelerLoading] = useState(false)
  const [tForm, setTForm] = useState({ nome: '', email: '', documento: '' })

  const loadData = async () => {
    if (!id) return
    try {
      const [tripData, travelersData] = await Promise.all([getTrip(id), getTravelers(id)])
      setTrip(tripData)
      setTravelers(travelersData)
    } catch (err) {
      toast({ title: 'Erro ao carregar viagem', variant: 'destructive' })
      navigate('/trips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('trips', (e) => {
    if (e.record.id === id) loadData()
  })
  useRealtime('viajantes', (e) => {
    if (e.record.viagem_id === id || !e.record.viagem_id) loadData()
  })

  const handleAddTraveler = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setTravelerLoading(true)
    try {
      await createTraveler({
        viagem_id: id,
        nome: tForm.nome,
        email: tForm.email || undefined,
        documento: tForm.documento || undefined,
      })
      toast({ title: 'Viajante adicionado com sucesso!' })
      setOpenTravelerModal(false)
      setTForm({ nome: '', email: '', documento: '' })
    } catch (err) {
      toast({ title: 'Erro ao adicionar viajante', variant: 'destructive' })
    } finally {
      setTravelerLoading(false)
    }
  }

  const handleRemoveTraveler = async (travelerId: string) => {
    try {
      await deleteTraveler(travelerId)
      toast({ title: 'Viajante removido.' })
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd/MM/yyyy') : ''
  }

  const formatCurrency = (val?: number, currency?: string) => {
    if (val === undefined) return ''
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(val)
  }

  if (loading) {
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!trip) return null

  return (
    <div id="pdf-content" className="container py-8 px-4 animate-fade-in space-y-8 bg-slate-50">
      <div className="print-hidden flex justify-between items-center mb-4">
        <Button variant="ghost" className="-ml-4 text-slate-500" asChild>
          <Link to="/trips">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagens
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/trips/${trip.id}/report?export=true`}>
            <Printer className="h-4 w-4 mr-2" /> Exportar Relatório
          </Link>
        </Button>
      </div>
      <div>
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{trip.title}</h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" /> {trip.destination}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex gap-4 items-center bg-white border px-4 py-2 rounded-lg shadow-sm overflow-x-auto">
              <div className="flex items-center gap-2 text-sm border-r pr-4 whitespace-nowrap">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">
                  {formatDate(trip.start_date)} até {formatDate(trip.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                <Banknote className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{formatCurrency(trip.budget_total, trip.moeda)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full print-hidden">
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/documents/${trip.id}`}>
                  <FileText className="mr-2 h-4 w-4" /> Documentos
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/trips/${trip.id}/tickets-reservas`}>
                  <Ticket className="mr-2 h-4 w-4" /> Logística
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/orcamento/${trip.id}`}>
                  <Banknote className="mr-2 h-4 w-4" /> Orçamento
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/trips/${trip.id}/report`}>
                  <BarChart2 className="mr-2 h-4 w-4" /> Relatório
                </Link>
              </Button>
              <Button className="w-full col-span-2 sm:col-span-1 lg:col-span-1" asChild>
                <Link to={`/trips/${trip.id}/itinerary`}>
                  <Map className="mr-2 h-4 w-4" /> Itinerário
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {trip.descricao && (
        <Card className="bg-slate-50 border-none shadow-none">
          <CardContent className="p-4 text-slate-700">{trip.descricao}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Viajantes ({travelers.length})
          </h2>
          <Dialog open={openTravelerModal} onOpenChange={setOpenTravelerModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto print-hidden">
                <UserPlus className="h-4 w-4" /> Adicionar Viajante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Viajante</DialogTitle>
                <DialogDescription>
                  Preencha os dados do viajante para adicioná-lo à viagem.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTraveler} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    required
                    value={tForm.nome}
                    onChange={(e) => setTForm({ ...tForm, nome: e.target.value })}
                    placeholder="João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail (Opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tForm.email}
                    onChange={(e) => setTForm({ ...tForm, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">Documento (Opcional)</Label>
                  <Input
                    id="documento"
                    value={tForm.documento}
                    onChange={(e) => setTForm({ ...tForm, documento: e.target.value })}
                    placeholder="Passaporte ou RG"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={travelerLoading}>
                  {travelerLoading ? 'Adicionando...' : 'Adicionar Viajante'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {travelers.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed rounded-lg shadow-sm">
            <div className="bg-slate-50 inline-flex p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">Nenhum viajante</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Adicione os acompanhantes dessa viagem para manter todos os documentos e despesas
              centralizados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {travelers.map((t) => (
              <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="overflow-hidden flex-1 pr-4">
                    <h3 className="font-medium text-slate-900 truncate" title={t.nome}>
                      {t.nome}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1.5">
                      {t.email && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />{' '}
                          <span className="truncate">{t.email}</span>
                        </div>
                      )}
                      {t.documento && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />{' '}
                          <span className="truncate">{t.documento}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity print-hidden"
                    onClick={() => handleRemoveTraveler(t.id)}
                    title="Remover viajante"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
