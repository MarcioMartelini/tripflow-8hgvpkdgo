import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Reserva, createReserva, updateReserva } from '@/services/reservas'
import { useToast } from '@/hooks/use-toast'

const FormSelect = ({ label, value, onChange, options }: any) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o: any) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export function ReservaDialog({ open, onOpenChange, tripId, reserva, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Partial<Reserva>>({})

  useEffect(() => {
    if (open) {
      setError('')
      setFormData(reserva || { tipo: 'hotel', moeda: 'BRL', status: 'confirmado', preco: 0 })
    }
  }, [open, reserva])

  const handleChange = (f: keyof Reserva, v: any) => setFormData((p) => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { data_checkin, data_checkout } = formData

    if (data_checkin && data_checkout) {
      const inD = new Date(data_checkin.substring(0, 10))
      const outD = new Date(data_checkout.substring(0, 10))
      if (outD < inD) return setError('Check-out deve ser igual ou posterior ao check-in.')
    }

    setLoading(true)
    try {
      if (reserva?.id) await updateReserva(reserva.id, formData)
      else await createReserva({ ...formData, viagem_id: tripId } as Reserva)

      toast({ title: reserva ? 'Reserva atualizada!' : 'Reserva criada!' })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reserva ? 'Editar Reserva' : 'Adicionar Reserva'}</DialogTitle>
          <DialogDescription>Preencha os detalhes da sua reserva.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Tipo *"
              value={formData.tipo}
              onChange={(v: any) => handleChange('tipo', v)}
              options={[
                { value: 'hotel', label: 'Hotel' },
                { value: 'restaurante', label: 'Restaurante' },
                { value: 'atividade', label: 'Atividade' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
            <FormSelect
              label="Status *"
              value={formData.status}
              onChange={(v: any) => handleChange('status', v)}
              options={[
                { value: 'confirmado', label: 'Confirmado' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />

            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                required
                value={formData.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Local *</Label>
              <Input
                required
                value={formData.local || ''}
                onChange={(e) => handleChange('local', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Data Check-in *</Label>
              <Input
                type="date"
                required
                value={formData.data_checkin?.substring(0, 10) || ''}
                onChange={(e) => handleChange('data_checkin', e.target.value + ' 12:00:00.000Z')}
              />
            </div>
            <div className="space-y-1">
              <Label>Hora Check-in</Label>
              <Input
                type="time"
                value={formData.hora_checkin || ''}
                onChange={(e) => handleChange('hora_checkin', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Data Check-out</Label>
              <Input
                type="date"
                value={formData.data_checkout?.substring(0, 10) || ''}
                onChange={(e) =>
                  handleChange(
                    'data_checkout',
                    e.target.value ? e.target.value + ' 12:00:00.000Z' : '',
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Hora Check-out</Label>
              <Input
                type="time"
                value={formData.hora_checkout || ''}
                onChange={(e) => handleChange('hora_checkout', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Nº Confirmação</Label>
              <Input
                value={formData.numero_confirmacao || ''}
                onChange={(e) => handleChange('numero_confirmacao', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Preço *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.preco || ''}
                onChange={(e) => handleChange('preco', parseFloat(e.target.value))}
              />
            </div>

            <FormSelect
              label="Moeda *"
              value={formData.moeda}
              onChange={(v: any) => handleChange('moeda', v)}
              options={[
                { value: 'BRL', label: 'BRL' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'AUD', label: 'AUD' },
              ]}
            />
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={formData.notas || ''}
              onChange={(e) => handleChange('notas', e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
