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

export function ReservaDialog({ open, onOpenChange, tripId, reserva, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<Reserva>>({})

  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [filesToRemove, setFilesToRemove] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setError('')
      setFieldErrors({})
      setFormData(
        reserva || {
          tipo: 'hotel',
          moeda: 'BRL',
          status: 'confirmado',
          preco: 0,
          categoria: 'hospagem',
        },
      )
      setExistingFiles(
        reserva?.arquivo
          ? Array.isArray(reserva.arquivo)
            ? reserva.arquivo
            : [reserva.arquivo]
          : [],
      )
      setNewFiles([])
      setFilesToRemove([])
    }
  }, [open, reserva])

  const handleChange = (f: keyof Reserva, v: any) => {
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
      'nome',
      'local',
      'data_checkin',
      'preco',
      'moeda',
      'categoria',
    ] as const
    requiredFields.forEach((field) => {
      if (formData[field] === undefined || formData[field] === null || formData[field] === '') {
        newErrors[field] = 'Este campo é obrigatório.'
      }
    })

    const { data_checkin, data_checkout } = formData

    if (data_checkin && data_checkout) {
      const inD = data_checkin.substring(0, 10)
      const outD = data_checkout.substring(0, 10)

      if (outD <= inD) {
        newErrors.data_checkout = 'Check-out deve ser posterior ao check-in.'
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

    const submitData = new FormData()
    submitData.append('viagem_id', tripId)

    Object.entries(finalData).forEach(([key, value]) => {
      if (key !== 'arquivo' && key !== 'expand' && value !== undefined && value !== null) {
        submitData.append(key, value.toString())
      }
    })

    newFiles.forEach((f) => submitData.append('arquivo', f))
    filesToRemove.forEach((f) => submitData.append('arquivo-', f))

    setLoading(true)
    try {
      if (reserva?.id) await updateReserva(reserva.id, submitData)
      else await createReserva(submitData)

      toast({
        title: reserva ? 'Reserva atualizada com sucesso!' : 'Reserva adicionada com sucesso!',
      })
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Tipo *"
              value={formData.tipo}
              onChange={(v: any) => handleChange('tipo', v)}
              error={fieldErrors.tipo}
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
              <Label>Nome *</Label>
              <Input
                value={formData.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
              />
              {fieldErrors.nome && <p className="text-xs text-red-500 mt-1">{fieldErrors.nome}</p>}
            </div>
            <div className="space-y-1">
              <Label>Local *</Label>
              <Input
                value={formData.local || ''}
                onChange={(e) => handleChange('local', e.target.value)}
              />
              {fieldErrors.local && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.local}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Data Check-in *</Label>
              <Input
                type="date"
                value={formData.data_checkin?.substring(0, 10) || ''}
                onChange={(e) =>
                  handleChange(
                    'data_checkin',
                    e.target.value ? e.target.value + ' 12:00:00.000Z' : '',
                  )
                }
              />
              {fieldErrors.data_checkin && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.data_checkin}</p>
              )}
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
              {fieldErrors.data_checkout && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.data_checkout}</p>
              )}
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
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={formData.notas || ''}
              onChange={(e) => handleChange('notas', e.target.value)}
            />
          </div>

          <div className="space-y-2 mt-2">
            <Label>Anexos (PDF)</Label>
            <div className="space-y-2">
              {existingFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded-md bg-slate-50"
                >
                  <span className="text-sm truncate mr-2">{file}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExistingFiles((prev) => prev.filter((f) => f !== file))
                      setFilesToRemove((prev) => [...prev, file])
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ))}
              {newFiles.map((file, i) => (
                <div
                  key={`new-${i}`}
                  className="flex items-center justify-between p-2 border rounded-md bg-slate-50"
                >
                  <span className="text-sm truncate mr-2">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
            <Input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e: any) => {
                if (e.target.files) {
                  const addedFiles = Array.from(e.target.files) as File[]
                  const invalidFiles = addedFiles.filter((f) => f.type !== 'application/pdf')
                  if (invalidFiles.length > 0) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      arquivo: 'Apenas arquivos PDF são permitidos.',
                    }))
                  } else {
                    setNewFiles((prev) => [...prev, ...addedFiles])
                    setFieldErrors((prev) => ({ ...prev, arquivo: '' }))
                  }
                }
                e.target.value = ''
              }}
            />
            {fieldErrors.arquivo && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.arquivo}</p>
            )}
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
