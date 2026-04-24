import { Reserva, deleteReserva } from '@/services/reservas'
import { Hotel, Utensils, Compass, CalendarDays, Edit, Trash2, FileText } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { formatCurrency, convertCurrency } from '@/lib/currency'
import { useAuth } from '@/hooks/use-auth'
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
import { useToast } from '@/hooks/use-toast'

interface Props {
  reserva: Reserva
  onEdit: (r: Reserva) => void
  onDelete: () => void
}

export function ReservaCard({ reserva, onEdit, onDelete }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()
  const userCurrency = user?.moeda_padrao || 'BRL'

  const getIcon = () => {
    switch (reserva.tipo) {
      case 'hotel':
        return <Hotel className="h-5 w-5" />
      case 'restaurante':
        return <Utensils className="h-5 w-5" />
      case 'atividade':
        return <Compass className="h-5 w-5" />
      default:
        return <CalendarDays className="h-5 w-5" />
    }
  }

  const handleDelete = async () => {
    try {
      await deleteReserva(reserva.id)
      toast({ title: 'Reserva deletada com sucesso!' })
      onDelete()
    } catch (err) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    }
  }

  const price = reserva.preco || 0
  const cPrice =
    reserva.moeda !== userCurrency
      ? convertCurrency(price, reserva.moeda || 'BRL', userCurrency)
      : null

  const statusColor = {
    confirmado: 'bg-green-100 text-green-800 hover:bg-green-100',
    pendente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    cancelado: 'bg-red-100 text-red-800 hover:bg-red-100',
  }[reserva.status || 'pendente']

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-primary font-medium">
            {getIcon()}
            <span className="capitalize">{reserva.tipo}</span>
          </div>
          <Badge className={statusColor} variant="outline">
            {reserva.status}
          </Badge>
        </div>

        <div className="flex-1 space-y-3">
          <div className="font-semibold text-lg leading-tight">{reserva.nome}</div>
          <div className="text-sm text-muted-foreground">{reserva.local || '-'}</div>

          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div>
              <div className="text-muted-foreground text-xs">Check-in / Início</div>
              <div>
                {reserva.data_checkin ? format(parseISO(reserva.data_checkin), 'dd/MM/yyyy') : '-'}
              </div>
              <div className="text-muted-foreground">{reserva.hora_checkin || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Check-out / Fim</div>
              <div>
                {reserva.data_checkout
                  ? format(parseISO(reserva.data_checkout), 'dd/MM/yyyy')
                  : '-'}
              </div>
              <div className="text-muted-foreground">{reserva.hora_checkout || '-'}</div>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Confirmação:</span>{' '}
            {reserva.numero_confirmacao || '-'}
          </div>

          <div className="pt-2 border-t mt-2 flex justify-between items-end">
            <div>
              <div className="font-medium text-lg">
                {formatCurrency(price, reserva.moeda || 'BRL')}
              </div>
              {cPrice !== null && (
                <div className="text-xs text-muted-foreground">
                  ≈ {formatCurrency(cPrice, userCurrency)}
                </div>
              )}
            </div>
            {reserva.arquivo && (
              <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                <a
                  href={pb.files.getURL(reserva, reserva.arquivo as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  PDF
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => onEdit(reserva)}>
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja deletar esta reserva?</AlertDialogTitle>
                <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
