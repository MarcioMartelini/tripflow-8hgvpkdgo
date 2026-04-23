import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plane, Hotel, Calendar, File, Bell, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getAlertas, markAlertaAsRead, deleteAlerta, type Alerta } from '@/services/alertas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function Alerts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [alertaToDelete, setAlertaToDelete] = useState<string | null>(null)

  const loadAlertas = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(false)
      const data = await getAlertas(user.id)
      setAlertas(data)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlertas()
  }, [user])

  useRealtime('alertas', () => {
    loadAlertas()
  })

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAlertaAsRead(id)
    } catch (err) {
      toast({ title: 'Erro ao atualizar alerta', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!alertaToDelete) return
    try {
      await deleteAlerta(alertaToDelete)
      toast({ title: 'Alerta deletado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao deletar alerta', variant: 'destructive' })
    } finally {
      setAlertaToDelete(null)
    }
  }

  const unreadAlertas = alertas.filter((a) => !a.lido)

  const renderAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'voo':
        return <Plane className="h-5 w-5 text-blue-500" />
      case 'hotel':
        return <Hotel className="h-5 w-5 text-indigo-500" />
      case 'atividade':
        return <Calendar className="h-5 w-5 text-orange-500" />
      case 'documento':
        return <File className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const renderAlertList = (list: Alerta[]) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
          <div className="bg-red-50 rounded-full p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar alertas</h3>
          <Button onClick={loadAlertas} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      )
    }

    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="bg-slate-100 rounded-full p-6 mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum alerta</h3>
          <p className="text-muted-foreground">Você está em dia!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4 animate-fade-in-up">
        {list.map((alerta) => (
          <Card
            key={alerta.id}
            className={cn(
              'transition-all duration-200 hover:shadow-md',
              alerta.lido ? 'bg-slate-50/50' : 'bg-white border-l-4 border-l-primary',
            )}
          >
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={cn(
                    'p-3 rounded-full shrink-0',
                    alerta.lido ? 'bg-slate-100' : 'bg-primary/10',
                  )}
                >
                  {renderAlertIcon(alerta.tipo)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={alerta.lido ? 'secondary' : 'default'} className="capitalize">
                      {alerta.tipo}
                    </Badge>
                    {!alerta.lido && (
                      <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-sm sm:text-base',
                      alerta.lido ? 'text-slate-600' : 'text-slate-900 font-medium',
                    )}
                  >
                    {alerta.mensagem}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(alerta.created), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-end mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                {!alerta.lido && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-8 text-xs"
                    onClick={() => handleMarkAsRead(alerta.id)}
                  >
                    Marcar como lido
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setAlertaToDelete(alerta.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Deletar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Alertas</h1>
        <p className="text-muted-foreground">
          Acompanhe notificações importantes sobre suas viagens.
        </p>
      </div>

      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="unread" className="relative">
            Não Lidos
            {unreadAlertas.length > 0 && (
              <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {unreadAlertas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-0">
          {renderAlertList(unreadAlertas)}
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          {renderAlertList(alertas)}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!alertaToDelete}
        onOpenChange={(open) => !open && setAlertaToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar alerta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O alerta será removido permanentemente do seu
              histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
