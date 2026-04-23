import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { createTrip } from '@/services/trips'
import { useToast } from '@/hooks/use-toast'

export function NewTripDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createTrip({
        title: fd.get('title') as string,
        destination: fd.get('destination') as string,
        start_date: new Date(fd.get('start_date') as string).toISOString(),
        end_date: new Date(fd.get('end_date') as string).toISOString(),
        travelers_count: Number(fd.get('travelers_count')),
        budget_total: Number(fd.get('budget_total')),
        progress: 0,
        status: 'planned',
      })
      toast({ title: 'Viagem criada com sucesso!' })
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao criar viagem', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Viagem</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Viagem</DialogTitle>
          <DialogDescription>Preencha os detalhes da sua próxima aventura.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Viagem</Label>
            <Input id="title" name="title" required placeholder="Ex: Férias de Verão" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            <Input id="destination" name="destination" required placeholder="Ex: Paris, França" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travelers_count">Viajantes</Label>
              <Input
                id="travelers_count"
                name="travelers_count"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_total">Orçamento (R$)</Label>
              <Input
                id="budget_total"
                name="budget_total"
                type="number"
                min="0"
                defaultValue="0"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Criar Viagem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
