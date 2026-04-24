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
import { Ticket, createTicket, updateTicket } from '@/services/tickets'
import { useToast } from '@/hooks/use-toast'

const FormSelect = ({ label, value, onChange, options, error }: any) => (
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
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

export function TicketDialog({ open, onOpenChange, tripId, ticket, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<Ticket>>({})

  useEffect(() => {
    if (open) {
      setError('')
      setFieldErrors({})
      setFormData(
        ticket || {
          tipo: 'voo',
          moeda: 'BRL',
          status: 'confirmado',
          preco: 0,
          categoria: 'transporte',
        },
      )
    }
  }, [open, ticket])

  const handleChange = (f: keyof Ticket, v: any) => {
    setFormData((p) => ({ ...p, [f]: v }))
    if (fieldErrors[f]) setFieldErrors((p) => ({ ...p, [f]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const newErrors: Record<string, string> = {}

    const requiredFields = [
      'tipo',
      'status',
      'origem',
      'destino',
      'data_saida',
      'hora_saida',
      'data_chegada',
      'hora_chegada',
      'companhia',
      'numero_confirmacao',
      'preco',
      'moeda',
      'categoria',
    ] as const
    requiredFields.forEach((field) => {
      if (formData[field] === undefined || formData[field] === null || formData[field] === '') {
        newErrors[field] = 'Este campo é obrigatório.'
      }
    })

    const { data_saida, hora_saida, data_chegada, hora_chegada } = formData

    if (data_saida && hora_saida && data_chegada && hora_chegada) {
      const startD = data_saida.substring(0, 10)
      const endD = data_chegada.substring(0, 10)

      if (endD < startD) {
        newErrors.data_chegada = 'A data de chegada deve ser igual ou posterior à data de saída.'
      } else if (endD === startD) {
        if (hora_chegada <= hora_saida) {
          newErrors.hora_chegada = 'A hora de chegada deve ser posterior à hora de saída.'
        }
      }
    }

    if (formData.categoria === 'outro' && !formData.categoria_outro_descricao?.trim()) {
      newErrors.categoria_outro_descricao =
        'A explicação é obrigatória quando a categoria for "Outro".'
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      return
    }

    const finalData = { ...formData }
    if (finalData.categoria !== 'outro') {
      finalData.categoria_outro_descricao = ''
    }

    setLoading(true)
    try {
      if (ticket?.id) await updateTicket(ticket.id, finalData)
      else await createTicket({ ...finalData, viagem_id: tripId } as Ticket)

      toast({ title: ticket ? 'Ticket atualizado com sucesso!' : 'Ticket adicionado com sucesso!' })
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
          <DialogTitle>{ticket ? 'Editar Ticket' : 'Adicionar Ticket'}</DialogTitle>
          <DialogDescription>Preencha os detalhes do transporte.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Tipo *"
              value={formData.tipo}
              onChange={(v: any) => handleChange('tipo', v)}
              error={fieldErrors.tipo}
              options={[
                { value: 'voo', label: 'Voo' },
                { value: 'trem', label: 'Trem' },
                { value: 'onibus', label: 'Ônibus' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
            <FormSelect
              label="Status *"
              value={formData.status}
              onChange={(v: any) => handleChange('status', v)}
              error={fieldErrors.status}
              options={[
                { value: 'confirmado', label: 'Confirmado' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />

            <FormSelect
              label="Categoria *"
              value={formData.categoria}
              onChange={(v: any) => handleChange('categoria', v)}
              error={fieldErrors.categoria}
              options={[
                { value: 'hospedagem', label: 'Hospedagem' },
                { value: 'transporte', label: 'Transporte' },
                { value: 'alimentação', label: 'Alimentação' },
                { value: 'atividade', label: 'Atividade' },
                { value: 'compras', label: 'Compras' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
            {formData.categoria === 'outro' && (
              <div className="space-y-1">
                <Label>Explicação (Categoria Outro) *</Label>
                <Input
                  value={formData.categoria_outro_descricao || ''}
                  onChange={(e) => handleChange('categoria_outro_descricao', e.target.value)}
                  placeholder="Especifique a categoria..."
                />
                {fieldErrors.categoria_outro_descricao && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.categoria_outro_descricao}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label>Origem *</Label>
              <Input
                value={formData.origem || ''}
                onChange={(e) => handleChange('origem', e.target.value)}
              />
              {fieldErrors.origem && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.origem}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Destino *</Label>
              <Input
                value={formData.destino || ''}
                onChange={(e) => handleChange('destino', e.target.value)}
              />
              {fieldErrors.destino && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.destino}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Data Saída *</Label>
              <Input
                type="date"
                value={formData.data_saida?.substring(0, 10) || ''}
                onChange={(e) =>
                  handleChange(
                    'data_saida',
                    e.target.value ? e.target.value + ' 12:00:00.000Z' : '',
                  )
                }
              />
              {fieldErrors.data_saida && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.data_saida}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Hora Saída *</Label>
              <Input
                type="time"
                value={formData.hora_saida || ''}
                onChange={(e) => handleChange('hora_saida', e.target.value)}
              />
              {fieldErrors.hora_saida && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.hora_saida}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Data Chegada *</Label>
              <Input
                type="date"
                value={formData.data_chegada?.substring(0, 10) || ''}
                onChange={(e) =>
                  handleChange(
                    'data_chegada',
                    e.target.value ? e.target.value + ' 12:00:00.000Z' : '',
                  )
                }
              />
              {fieldErrors.data_chegada && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.data_chegada}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Hora Chegada *</Label>
              <Input
                type="time"
                value={formData.hora_chegada || ''}
                onChange={(e) => handleChange('hora_chegada', e.target.value)}
              />
              {fieldErrors.hora_chegada && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.hora_chegada}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Companhia *</Label>
              <Input
                value={formData.companhia || ''}
                onChange={(e) => handleChange('companhia', e.target.value)}
              />
              {fieldErrors.companhia && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.companhia}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Nº Confirmação *</Label>
              <Input
                value={formData.numero_confirmacao || ''}
                onChange={(e) => handleChange('numero_confirmacao', e.target.value)}
              />
              {fieldErrors.numero_confirmacao && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.numero_confirmacao}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Preço *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.preco ?? ''}
                onChange={(e) =>
                  handleChange('preco', e.target.value ? parseFloat(e.target.value) : '')
                }
              />
              {fieldErrors.preco && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.preco}</p>
              )}
            </div>
            <FormSelect
              label="Moeda *"
              value={formData.moeda}
              onChange={(v: any) => handleChange('moeda', v)}
              error={fieldErrors.moeda}
              options={[
                { value: 'BRL', label: 'BRL' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'AUD', label: 'AUD' },
              ]}
            />

            <div className="space-y-1 md:col-span-2 mt-2">
              <Label>Anexo (PDF, max 5MB)</Label>
              {formData.arquivo ? (
                <div className="flex items-center justify-between p-2 border rounded-md bg-slate-50">
                  <span className="text-sm truncate mr-2">
                    {typeof formData.arquivo === 'string'
                      ? formData.arquivo
                      : (formData.arquivo as File).name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChange('arquivo', '')}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e: any) => handleChange('arquivo', e.target.files?.[0] || '')}
                />
              )}
              {fieldErrors.arquivo && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.arquivo}</p>
              )}
            </div>
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
