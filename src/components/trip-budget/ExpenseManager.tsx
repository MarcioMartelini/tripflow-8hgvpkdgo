import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Despesa, createDespesa, updateDespesa, deleteDespesa } from '@/services/finances'
import { CATEGORIAS, MOEDAS } from '@/lib/budget-utils'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { Edit2, Trash2, Plus, ArrowUpDown, Receipt } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface Props {
  despesas: Despesa[]
  tripId: string
  onReload: () => void
}

export function ExpenseManager({ despesas, tripId, onReload }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [filterCat, setFilterCat] = useState<string>('all')
  const [sortDesc, setSortDesc] = useState(true)

  const [isModalOpen, setModalOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    data: '',
    categoria: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
  })
  const [formError, setFormError] = useState('')

  const filtered = useMemo(() => {
    let res = [...despesas]
    if (filterCat !== 'all') res = res.filter((d) => d.categoria === filterCat)
    res.sort((a, b) =>
      sortDesc
        ? b.data_despesa.localeCompare(a.data_despesa)
        : a.data_despesa.localeCompare(b.data_despesa),
    )
    return res
  }, [despesas, filterCat, sortDesc])

  const openAdd = () => {
    setForm({
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      descricao: '',
      valor: '',
      moeda: user?.moeda_padrao || 'BRL',
    })
    setEditingId(null)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (d: Despesa) => {
    setForm({
      data: d.data_despesa.split('T')[0],
      categoria: d.categoria,
      descricao: d.descricao,
      valor: d.valor.toString(),
      moeda: d.moeda,
    })
    setEditingId(d.id)
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.data || !form.categoria || !form.descricao || !form.valor || !form.moeda) {
      return setFormError('Preencha todos os campos.')
    }
    const val = parseFloat(form.valor)
    if (isNaN(val) || val <= 0) return setFormError('Valor deve ser maior que 0.')

    try {
      const payload = {
        viagem_id: tripId,
        usuario_id: user?.id,
        categoria: form.categoria,
        descricao: form.descricao,
        valor: val,
        moeda: form.moeda,
        data_despesa: new Date(form.data).toISOString(),
      }
      if (editingId) await updateDespesa(editingId, payload)
      else await createDespesa(payload)
      toast({ title: 'Despesa salva com sucesso!' })
      setModalOpen(false)
      onReload()
    } catch (error) {
      setFormError('Erro ao salvar despesa.')
    }
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      await deleteDespesa(deletingId)
      toast({ title: 'Despesa removida!' })
      setDeleteOpen(false)
      onReload()
    } catch (error) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Gerenciamento de Despesas</CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDesc(!sortDesc)}
            title="Ordenar por data"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button onClick={openAdd} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {despesas.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
            <Receipt className="h-12 w-12 mb-4 text-slate-300" />
            <p className="mb-4">Nenhuma despesa registrada</p>
            <Button onClick={openAdd} variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Despesa
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{format(parseISO(d.data_despesa), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="capitalize">{d.categoria}</TableCell>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(d.valor, d.moeda)}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Edit2 className="h-4 w-4 text-slate-500 hover:text-slate-900" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingId(d.id)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Adicionar'} Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                required
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                required
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select value={form.moeda} onValueChange={(v) => setForm({ ...form, moeda: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOEDAS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Tem certeza que deseja deletar esta despesa?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Deletar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
