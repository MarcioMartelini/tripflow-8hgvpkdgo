import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createItinerario, updateItinerario, ItinerarioEvent } from '@/services/itinerario'
import { format } from 'date-fns'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  tripId: string
  selectedDate: Date
  initialData?: ItinerarioEvent | null
}

export function ActivityModal({
  isOpen,
  onClose,
  onSaved,
  tripId,
  selectedDate,
  initialData,
}: ActivityModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    data: '',
    hora_inicio: '',
    hora_fim: '',
    tipo: 'atividade',
    atividade: '',
    local: '',
    notas: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          data: initialData.data.substring(0, 10),
          hora_inicio: initialData.hora_inicio || '',
          hora_fim: initialData.hora_fim || '',
          tipo: initialData.tipo || 'atividade',
          atividade: initialData.atividade || '',
          local: initialData.local || '',
          notas: initialData.notas || '',
        })
      } else {
        setForm({
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora_inicio: '09:00',
          hora_fim: '10:00',
          tipo: 'atividade',
          atividade: '',
          local: '',
          notas: '',
        })
      }
    }
  }, [isOpen, initialData, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.hora_fim && form.hora_fim <= form.hora_inicio) {
      toast({
        title: 'Horário inválido',
        description: 'A hora de fim deve ser posterior à hora de início.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        viagem_id: tripId,
        data: `${form.data} 12:00:00.000Z`,
      }

      if (initialData) {
        await updateItinerario(initialData.id, payload)
        toast({ title: 'Atividade atualizada com sucesso!' })
      } else {
        await createItinerario(payload)
        toast({ title: 'Atividade adicionada com sucesso!' })
      }
      onSaved()
      onClose()
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a atividade. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          <DialogDescription>Preencha os detalhes da atividade no itinerário.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                required
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voo">Voo</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="atividade">Atividade</SelectItem>
                  <SelectItem value="refeição">Refeição</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora Início</Label>
              <Input
                id="hora_inicio"
                type="time"
                required
                value={form.hora_inicio}
                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fim">Hora Fim (Opcional)</Label>
              <Input
                id="hora_fim"
                type="time"
                value={form.hora_fim}
                onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="atividade">Título da Atividade</Label>
            <Input
              id="atividade"
              required
              placeholder="Ex: Visita ao Museu"
              value={form.atividade}
              onChange={(e) => setForm({ ...form, atividade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local (Opcional)</Label>
            <Input
              id="local"
              placeholder="Ex: Centro Histórico"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Detalhes adicionais, reservas, etc."
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Atividade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
