import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { cn } from '@/lib/utils'
import {
  getComentarios,
  createComentario,
  deleteComentario,
  Comentario,
} from '@/services/comentarios'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, AlertCircle, RefreshCw, Loader2, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'

export function ActivityComments({ atividadeId, tripId }: { atividadeId: string; tripId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [validationError, setValidationError] = useState('')

  const loadComentarios = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    setError(false)
    try {
      const data = await getComentarios(atividadeId)
      setComentarios(data)
    } catch (err) {
      if (!isRefresh) setError(true)
    } finally {
      if (!isRefresh) setLoading(false)
    }
  }

  useEffect(() => {
    loadComentarios()
  }, [atividadeId])

  useRealtime('comentarios', (e) => {
    if (e.record.atividade_id === atividadeId) {
      loadComentarios(true)
    }
  })

  const handleAdd = async () => {
    if (!user) return
    if (!texto.trim()) {
      setValidationError('O comentário não pode ser vazio.')
      return
    }
    setValidationError('')
    setSubmitting(true)
    try {
      await createComentario({
        atividade_id: atividadeId,
        usuario_id: user.id,
        viagem_id: tripId,
        texto: texto.trim(),
      })
      setTexto('')
      await loadComentarios(true)
      toast({ title: 'Comentário adicionado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao adicionar comentário', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!commentToDelete) return
    try {
      await deleteComentario(commentToDelete)
      setComentarios((prev) => prev.filter((c) => c.id !== commentToDelete))
      toast({ title: 'Comentário deletado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao deletar comentário', variant: 'destructive' })
    } finally {
      setCommentToDelete(null)
    }
  }

  const renderTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    }
    return format(date, 'dd/MM HH:mm')
  }

  if (loading) {
    return (
      <div className="space-y-4 mt-4 pt-4 border-t border-slate-100 animate-fade-in">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
          <MessageSquare className="w-4 h-4 text-slate-500" /> Comentários
        </h3>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-100 text-center py-4">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600 mb-3">Erro ao carregar comentários</p>
        <Button variant="outline" size="sm" onClick={() => loadComentarios()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-slate-100 animate-fade-in flex flex-col">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
        <MessageSquare className="w-4 h-4 text-slate-500" /> Comentários ({comentarios.length})
      </h3>

      {/* New Comment Interface */}
      <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <Textarea
          placeholder="Compartilhe sua opinião sobre esta atividade"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            if (e.target.value.trim()) setValidationError('')
          }}
          className={cn(
            'min-h-[80px] text-sm resize-none bg-white',
            validationError ? 'border-red-500 focus-visible:ring-red-500' : '',
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        {validationError && <p className="text-xs text-red-500 font-medium">{validationError}</p>}
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {submitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 mt-2">
        {comentarios.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhum comentário ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {comentarios.map((c) => {
              const isAuthor = user?.id === c.usuario_id
              const authorName = c.expand?.usuario_id?.name || 'Viajante'
              const avatarUrl = c.expand?.usuario_id?.avatar
                ? pb.files.getURL(c.expand.usuario_id, c.expand.usuario_id.avatar, {
                    thumb: '100x100',
                  })
                : null

              return (
                <div
                  key={c.id}
                  className="bg-white p-3 rounded-lg text-sm border shadow-sm flex gap-3 group animate-fade-in-up"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-slate-900 truncate">{authorName}</p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {renderTimestamp(c.created)}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap break-words">{c.texto}</p>
                  </div>
                  {isAuthor && (
                    <button
                      onClick={() => setCommentToDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 shrink-0 self-start p-1"
                      title="Deletar comentário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!commentToDelete} onOpenChange={(o) => !o && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Comentário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este comentário?
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
