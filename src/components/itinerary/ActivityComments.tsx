import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getComentarios, createComentario, Comentario } from '@/services/comentarios'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function ActivityComments({ atividadeId, tripId }: { atividadeId: string; tripId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)

  const loadComentarios = async () => {
    if (!atividadeId) return
    try {
      const data = await getComentarios(atividadeId)
      setComentarios(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadComentarios()
  }, [atividadeId])

  const handleAdd = async () => {
    if (!texto.trim() || !user) return
    setLoading(true)
    try {
      await createComentario({
        atividade_id: atividadeId,
        usuario_id: user.id,
        viagem_id: tripId,
        texto: texto.trim(),
      })
      setTexto('')
      await loadComentarios()
      toast({ title: 'Comentário adicionado!' })
    } catch (err) {
      toast({ title: 'Erro ao adicionar comentário', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
      <h3 className="text-sm font-semibold">Comentários</h3>
      <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
        {comentarios.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum comentário ainda. Adicione o primeiro!
          </p>
        ) : (
          comentarios.map((c) => (
            <div
              key={c.id}
              className="bg-slate-50 p-3 rounded-md text-sm border border-slate-100 shadow-sm"
            >
              <p className="text-slate-800">{c.texto}</p>
              <div className="mt-1 text-[10px] text-muted-foreground text-right">
                {format(new Date(c.created), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="text-sm h-9"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button size="sm" className="h-9" onClick={handleAdd} disabled={loading || !texto.trim()}>
          {loading ? '...' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}
