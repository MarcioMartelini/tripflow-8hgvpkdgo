import { Ticket, deleteTicket } from '@/services/tickets'
import { Plane, Train, Bus, Ticket as TicketIcon, Edit, Trash2, FileText } from 'lucide-react'
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
  ticket: Ticket
  onEdit: (t: Ticket) => void
  onDelete: () => void
  onPreview?: (url: string, title: string) => void
}

export function TicketCard({ ticket, onEdit, onDelete }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()
  const userCurrency = user?.moeda_padrao || 'BRL'

  const getIcon = () => {
    switch (ticket.tipo) {
      case 'voo':
        return <Plane className="h-5 w-5" />
      case 'trem':
        return <Train className="h-5 w-5" />
      case 'onibus':
        return <Bus className="h-5 w-5" />
      default:
        return <TicketIcon className="h-5 w-5" />
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTicket(ticket.id)
      toast({ title: 'Ticket deletado com sucesso!' })
      onDelete()
    } catch (err) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    }
  }

  const price = ticket.preco || 0
  const cPrice =
    ticket.moeda !== userCurrency
      ? convertCurrency(price, ticket.moeda || 'BRL', userCurrency)
      : null

  const statusColor = {
    confirmado: 'bg-green-100 text-green-800 hover:bg-green-100',
    pendente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    cancelado: 'bg-red-100 text-red-800 hover:bg-red-100',
  }[ticket.status || 'pendente']

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-primary font-medium">
            {getIcon()}
            <span className="capitalize">{ticket.tipo}</span>
          </div>
          <Badge className={statusColor} variant="outline">
            {ticket.status}
          </Badge>
        </div>

        <div className="flex-1 space-y-3">
          <div className="font-semibold text-lg leading-tight">
            {ticket.origem} <span className="text-muted-foreground mx-1">→</span> {ticket.destino}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Saída</div>
              <div>
                {ticket.data_saida ? format(parseISO(ticket.data_saida), 'dd/MM/yyyy') : '-'}
              </div>
              <div className="text-muted-foreground">{ticket.hora_saida || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Chegada</div>
              <div>
                {ticket.data_chegada ? format(parseISO(ticket.data_chegada), 'dd/MM/yyyy') : '-'}
              </div>
              <div className="text-muted-foreground">{ticket.hora_chegada || '-'}</div>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Cia:</span> {ticket.companhia || '-'} <br />
            <span className="text-muted-foreground">Reserva:</span>{' '}
            {ticket.numero_confirmacao || '-'}
          </div>

          <div className="pt-2 border-t mt-2 flex justify-between items-end">
            <div>
              <div className="font-medium text-lg">
                {formatCurrency(price, ticket.moeda || 'BRL')}
              </div>
              {cPrice !== null && (
                <div className="text-xs text-muted-foreground">
                  ≈ {formatCurrency(cPrice, userCurrency)}
                </div>
              )}
            </div>
            {ticket.arquivo && ticket.arquivo.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {(Array.isArray(ticket.arquivo) ? ticket.arquivo : [ticket.arquivo]).map(
                  (f, i, arr) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        const url = pb.files.getURL(ticket, f)
                        if (onPreview) {
                          onPreview(
                            url,
                            `Ticket ${ticket.tipo} - PDF ${arr.length > 1 ? i + 1 : ''}`,
                          )
                        } else {
                          window.open(url, '_blank')
                        }
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF {arr.length > 1 ? i + 1 : ''}
                    </Button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => onEdit(ticket)}>
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
                <AlertDialogTitle>Tem certeza que deseja deletar este ticket?</AlertDialogTitle>
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
