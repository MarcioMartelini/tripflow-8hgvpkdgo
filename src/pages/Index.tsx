import { useEffect, useState } from 'react'
import { getTrips, type Trip } from '@/services/trips'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Map } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function Index() {
  const [trips, setTrips] = useState<Trip[]>([])

  const loadData = async () => {
    try {
      const data = await getTrips()
      setTrips(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('trips', () => {
    loadData()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'ongoing':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'completed':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-100'
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planejada'
      case 'ongoing':
        return 'Em andamento'
      case 'completed':
        return 'Concluída'
      default:
        return status
    }
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
        <p className="text-slate-500">Acompanhe suas viagens e planeje seus próximos destinos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-white border-dashed shadow-sm">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Map className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma viagem encontrada</h3>
            <p className="text-slate-500 max-w-sm">
              Você ainda não tem viagens planejadas. Clique em "Nova Viagem" para começar.
            </p>
          </div>
        ) : (
          trips.map((trip) => {
            const start = new Date(trip.start_date)
            const end = new Date(trip.end_date)
            return (
              <Card
                key={trip.id}
                className="hover:shadow-md transition-all duration-200 border-slate-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                      {trip.title}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={cn('shrink-0', getStatusColor(trip.status))}
                    >
                      {getStatusText(trip.status)}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{trip.destination}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-md">
                    <Calendar className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">
                      {format(start, "dd 'de' MMM", { locale: ptBR })} —{' '}
                      {format(end, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
