import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Documento } from '@/services/documentos'
import { getTravelers, Traveler } from '@/services/travelers'
import {
  shareDocument,
  getSharesByDocument,
  revokeShare,
  CompartilhamentoDocumento,
} from '@/services/compartilhamento_documentos'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { Trash2, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Props {
  doc: Documento | null
  onClose: () => void
}

export function ShareDocumentModal({ doc, onClose }: Props) {
  const { toast } = useToast()
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [shares, setShares] = useState<CompartilhamentoDocumento[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!doc) return
    const load = async () => {
      try {
        const [t, s] = await Promise.all([getTravelers(doc.viagem_id), getSharesByDocument(doc.id)])
        const sharedUserIds = new Set(s.map((share) => share.usuario_receptor))
        const validTravelers = t.filter((tr) => tr.usuario_id && !sharedUserIds.has(tr.usuario_id))

        setTravelers(validTravelers)
        setShares(s)
      } catch (err) {
        toast({ title: 'Erro ao carregar viajantes', variant: 'destructive' })
      }
    }
    load()
    setSelectedUsers(new Set())
    setConsent(false)
  }, [doc, toast])

  const toggleUser = (userId: string) => {
    const next = new Set(selectedUsers)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setSelectedUsers(next)
  }

  const handleShare = async () => {
    if (!doc || selectedUsers.size === 0 || !consent) return
    setLoading(true)
    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        shareDocument(doc.id, userId, consent),
      )
      await Promise.all(promises)
      toast({ title: 'Documento compartilhado com sucesso!' })

      const [t, s] = await Promise.all([getTravelers(doc.viagem_id), getSharesByDocument(doc.id)])
      const sharedUserIds = new Set(s.map((share) => share.usuario_receptor))
      const validTravelers = t.filter((tr) => tr.usuario_id && !sharedUserIds.has(tr.usuario_id))

      setTravelers(validTravelers)
      setShares(s)
      setSelectedUsers(new Set())
      setConsent(false)
    } catch (err) {
      toast({ title: 'Erro ao compartilhar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return
    try {
      await revokeShare(shareId)
      toast({ title: 'Acesso revogado com sucesso!' })

      if (!doc) return
      const [t, s] = await Promise.all([getTravelers(doc.viagem_id), getSharesByDocument(doc.id)])
      const sharedUserIds = new Set(s.map((share) => share.usuario_receptor))
      const validTravelers = t.filter((tr) => tr.usuario_id && !sharedUserIds.has(tr.usuario_id))

      setTravelers(validTravelers)
      setShares(s)
    } catch (err) {
      toast({ title: 'Erro ao revogar acesso', variant: 'destructive' })
    }
  }

  if (!doc) return null

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Documento</DialogTitle>
          <DialogDescription>
            {doc.nome_arquivo} ({doc.tipo})
            {doc.data_expiracao &&
              ` • Expira em ${format(parseISO(doc.data_expiracao), 'dd/MM/yyyy')}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shares.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-900">Acesso Concedido</h4>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between bg-slate-50 p-2 rounded-md border"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {share.expand?.usuario_receptor?.name || 'Usuário'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(share.id)}
                      className="text-red-500 h-7 px-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Revogar Acesso
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-900">Compartilhar com Viajantes</h4>
            {travelers.length === 0 ? (
              <p className="text-sm text-slate-500">
                Não há viajantes disponíveis com conta cadastrada nesta viagem.
              </p>
            ) : (
              <div className="space-y-2 border rounded-md p-3">
                {travelers.map((t) => (
                  <div key={t.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${t.usuario_id}`}
                      checked={t.usuario_id ? selectedUsers.has(t.usuario_id) : false}
                      onCheckedChange={() => t.usuario_id && toggleUser(t.usuario_id)}
                    />
                    <Label
                      htmlFor={`user-${t.usuario_id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t.nome}{' '}
                      {t.email && <span className="text-slate-500 font-normal">({t.email})</span>}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {travelers.length > 0 && (
            <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-md border border-blue-100 mt-4">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(c) => setConsent(c as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="consent" className="text-sm font-semibold text-blue-900">
                  Concordo em compartilhar este documento com os viajantes selecionados
                </Label>
                <p className="text-xs text-blue-700">
                  Ao compartilhar, os viajantes selecionados poderão visualizar este documento.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button disabled={loading || selectedUsers.size === 0 || !consent} onClick={handleShare}>
            {loading ? 'Compartilhando...' : 'Compartilhar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
