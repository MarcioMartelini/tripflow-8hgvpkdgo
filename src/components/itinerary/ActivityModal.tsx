import { useEffect, useState } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
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
import { ActivityComments } from './ActivityComments'
import pb from '@/lib/pocketbase/client'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  tripId: string
  selectedDate: Date
  initialData?: ItinerarioEvent | null
  onPreview?: (url: string, title: string) => void
}

export function ActivityModal({
  isOpen,
  onClose,
  onSaved,
  tripId,
  selectedDate,
  initialData,
  onPreview,
}: ActivityModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [filesToRemove, setFilesToRemove] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
          )
          const data = await res.json()
          setSearchResults(data)
          setShowResults(true)
        } catch (e) {
          console.error(e)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSelectLocation = (result: any) => {
    setForm({
      ...form,
      local: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
    })
    setSearchQuery('')
    setShowResults(false)
  }

  const [form, setForm] = useState({
    data: '',
    hora_inicio: '',
    hora_fim: '',
    tipo: 'atividade',
    atividade: '',
    local: '',
    notas: '',
    preco: '',
    moeda: 'BRL',
    categoria: 'atividade',
    categoria_outro_descricao: '',
    latitude: '',
    longitude: '',
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
          preco: initialData.preco?.toString() || '',
          moeda: initialData.moeda || 'BRL',
          categoria: initialData.categoria || 'atividade',
          categoria_outro_descricao: initialData.categoria_outro_descricao || '',
          latitude: initialData.latitude?.toString() || '',
          longitude: initialData.longitude?.toString() || '',
        })
        setExistingFiles(
          initialData.arquivos
            ? Array.isArray(initialData.arquivos)
              ? initialData.arquivos
              : [initialData.arquivos]
            : [],
        )
      } else {
        setForm({
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora_inicio: '',
          hora_fim: '',
          tipo: 'atividade',
          atividade: '',
          local: '',
          notas: '',
          preco: '',
          moeda: 'BRL',
          categoria: 'atividade',
          categoria_outro_descricao: '',
          latitude: '',
          longitude: '',
        })
        setExistingFiles([])
      }
      setNewFiles([])
      setFilesToRemove([])
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

    if (form.categoria === 'outro' && !form.categoria_outro_descricao.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'A explicação é obrigatória quando a categoria for "Outro".',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('viagem_id', tripId)
      formData.append('data', `${form.data} 12:00:00.000Z`)
      formData.append('hora_inicio', form.hora_inicio)
      formData.append('hora_fim', form.hora_fim)
      formData.append('tipo', form.tipo)
      formData.append('atividade', form.atividade)
      formData.append('local', form.local)
      formData.append('notas', form.notas)
      if (form.preco) formData.append('preco', form.preco)
      formData.append('moeda', form.moeda)
      formData.append('categoria', form.categoria)
      formData.append(
        'categoria_outro_descricao',
        form.categoria === 'outro' ? form.categoria_outro_descricao : '',
      )
      formData.append('latitude', form.latitude || '')
      formData.append('longitude', form.longitude || '')

      newFiles.forEach((file) => {
        formData.append('arquivos', file)
      })
      filesToRemove.forEach((file) => {
        formData.append('arquivos-', file)
      })

      if (initialData) {
        await updateItinerario(initialData.id, formData)
        toast({ title: 'Atividade atualizada com sucesso!' })
      } else {
        await createItinerario(formData)
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
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospedagem">Hospedagem</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="alimentação">Alimentação</SelectItem>
                  <SelectItem value="atividade">Atividade</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.categoria === 'outro' && (
              <div className="space-y-2">
                <Label htmlFor="categoria_outro_descricao">Explicação *</Label>
                <Input
                  id="categoria_outro_descricao"
                  placeholder="Especifique a categoria"
                  value={form.categoria_outro_descricao}
                  onChange={(e) => setForm({ ...form, categoria_outro_descricao: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora Início (Opcional)</Label>
              <Input
                id="hora_inicio"
                type="time"
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

          <div className="space-y-2 relative">
            <Label>Buscar Localização (Auto-preencher)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Digite um endereço ou local para buscar..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true)
                }}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-start gap-2 text-sm"
                    onClick={() => handleSelectLocation(res)}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
                    <span className="line-clamp-2">{res.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local (Manual/Nome de exibição)</Label>
            <Input
              id="local"
              placeholder="Ex: Centro Histórico"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (Opcional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="Ex: -22.9068"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (Opcional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="Ex: -43.1729"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Custo (Opcional)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda</Label>
              <Select value={form.moeda} onValueChange={(v) => setForm({ ...form, moeda: v })}>
                <SelectTrigger id="moeda">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="space-y-2 mt-2">
            <Label>Anexos (PDF, JPG, PNG)</Label>
            <div className="space-y-2">
              {existingFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded-md bg-slate-50"
                >
                  <span className="text-sm truncate mr-2">{file}</span>
                  <div className="flex gap-2">
                    {initialData && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const url = pb.files.getURL(initialData, file, {
                            token: pb.authStore.token,
                          })
                          onPreview?.(url, file)
                        }}
                      >
                        Ver
                      </Button>
                    )}
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
              accept="application/pdf,image/jpeg,image/png,image/webp"
              multiple
              onChange={(e: any) => {
                if (e.target.files) {
                  const addedFiles = Array.from(e.target.files) as File[]
                  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
                  const invalidFiles = addedFiles.filter((f) => !allowedTypes.includes(f.type))
                  if (invalidFiles.length > 0) {
                    toast({
                      title: 'Formato inválido',
                      description: 'Apenas PDFs e imagens (JPG, PNG, WebP) são permitidos.',
                      variant: 'destructive',
                    })
                  } else {
                    setNewFiles((prev) => [...prev, ...addedFiles])
                  }
                }
                e.target.value = ''
              }}
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

        {initialData && <ActivityComments atividadeId={initialData.id} tripId={tripId} />}
      </DialogContent>
    </Dialog>
  )
}
