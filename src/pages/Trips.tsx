import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTrips, Trip } from '@/services/trips'
import { deleteViagem } from '@/services/viagens'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { TripFormModal } from '@/components/TripFormModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO, isValid } from 'date-fns'
import { MapPin, Users, Calendar, Banknote, Plane, Trash2, Edit, ExternalLink } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const loadTrips = async () => {
    try {
      setError(false)
      const data = await getTrips()
      setTrips(data)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrips()
  }, [])

  useRealtime('trips', () => {
    loadTrips()
  })

  const handleDelete = async () => {
    if (!tripToDelete) return
    setIsDeleting(true)
    try {
      await deleteViagem(tripToDelete)
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete))
      toast({ title: 'Viagem deletada com sucesso!' })
      setTripToDelete(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao deletar a viagem',
        description: 'Não foi possível deletar a viagem. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
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
      <div className="container py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center animate-fade-in">
        <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
          <Plane className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Ocorreu um erro ao carregar as viagens</h2>
        <Button onClick={loadTrips} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Minhas Viagens</h1>
        <TripFormModal>
          <Button className="gap-2">
            <Plane className="h-4 w-4" /> Nova Viagem
          </Button>
        </TripFormModal>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed shadow-sm">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Plane className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma viagem criada</h2>
          <p className="text-slate-500 mb-6 max-w-md">
            Você ainda não tem nenhuma viagem planejada. Crie sua primeira viagem para começar a
            organizar seu roteiro, orçamento e documentos.
          </p>
          <TripFormModal>
            <Button>Criar Primeira Viagem</Button>
          </TripFormModal>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card key={trip.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xl flex justify-between items-start gap-2">
                  <span className="line-clamp-2" title={trip.title}>
                    {trip.title}
                  </span>
                </CardTitle>
                <div className="flex items-center text-sm text-slate-500 mt-2 gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{trip.destination}</span>
                </div>
              </CardHeader>
              <CardContent className="py-4 flex-1 flex flex-col gap-3">
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>{trip.travelers_count || 1} viajantes</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <Banknote className="h-4 w-4 text-slate-400" />
                  <span>{formatCurrency(trip.budget_total, trip.moeda)}</span>
                </div>

                <div className="mt-auto pt-2 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Progresso</span>
                    <span className="text-primary">{trip.progress || 0}%</span>
                  </div>
                  <Progress value={trip.progress || 0} className="h-1.5" />
                </div>
              </CardContent>
              <CardFooter className="pt-3 pb-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link to={`/trips/${trip.id}`}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir
                  </Link>
                </Button>

                <TripFormModal trip={trip}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                </TripFormModal>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTripToDelete(trip.id)}
                  className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Deletar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!tripToDelete}
        onOpenChange={(open) => !open && !isDeleting && setTripToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar esta viagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados, itinerários e documentos vinculados a
              esta viagem serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isDeleting ? 'Deletando...' : 'Confirmar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
