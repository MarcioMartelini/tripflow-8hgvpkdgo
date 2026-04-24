import { useState, useEffect, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { createTrip, updateTrip, Trip } from '@/services/trips'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

interface TripFormModalProps {
  children: ReactNode
  trip?: Trip
}

export function TripFormModal({ children, trip }: TripFormModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return ''
    try {
      return isoString.split('T')[0]
    } catch {
      return ''
    }
  }

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget_total: 0,
    moeda: 'BRL',
    descricao: '',
    latitude: '',
    longitude: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setFormData({
        title: trip?.title || '',
        destination: trip?.destination || '',
        start_date: formatDateForInput(trip?.start_date),
        end_date: formatDateForInput(trip?.end_date),
        budget_total: trip?.budget_total || 0,
        moeda: trip?.moeda || 'BRL',
        descricao: trip?.descricao || '',
        latitude: trip?.latitude?.toString() || '',
        longitude: trip?.longitude?.toString() || '',
      })
      setErrors({})
    }
  }, [open, trip])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, moeda: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)

    if (end <= start) {
      setErrors({ end_date: 'A data de fim deve ser posterior à data de início.' })
      return
    }

    if (formData.budget_total <= 0) {
      setErrors({ budget_total: 'O orçamento deve ser um número positivo.' })
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        nome: formData.title,
        destino: formData.destination,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
        budget_total: Number(formData.budget_total),
        orcamento_planejado: Number(formData.budget_total),
        status: trip?.status || 'planned',
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
      }

      if (trip) {
        await updateTrip(trip.id, dataToSave)
        toast({ title: 'Viagem atualizada com sucesso!' })
      } else {
        await createTrip(dataToSave)
        toast({ title: 'Viagem criada com sucesso!' })
      }
      setOpen(false)
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setErrors(fieldErrs)
      } else {
        toast({ title: 'Erro ao salvar viagem', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{trip ? 'Editar Viagem' : 'Nova Viagem'}</DialogTitle>
          <DialogDescription>
            {trip
              ? 'Atualize os detalhes da sua viagem.'
              : 'Preencha os detalhes da sua próxima aventura.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome da Viagem</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Ex: Férias de Verão"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            <Input
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              placeholder="Ex: Paris, França"
            />
            {errors.destination && <p className="text-xs text-red-500">{errors.destination}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
              {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
              {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_total">Orçamento Planejado</Label>
              <Input
                id="budget_total"
                name="budget_total"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_total}
                onChange={handleChange}
                required
              />
              {errors.budget_total && <p className="text-xs text-red-500">{errors.budget_total}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda</Label>
              <Select value={formData.moeda} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude do Destino</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Ex: -22.9068"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude do Destino</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Ex: -43.1729"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Anotações sobre a viagem..."
              className="resize-none"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : trip ? 'Salvar Alterações' : 'Criar Viagem'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
