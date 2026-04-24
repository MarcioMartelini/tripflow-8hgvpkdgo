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
import { Edit2, Trash2, Plus, ArrowUpDown, Receipt, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { PdfViewerDialog } from '@/components/PdfViewerDialog'

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

  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [filesToRemove, setFilesToRemove] = useState<string[]>([])

  const [form, setForm] = useState({
    data: '',
    categoria: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
  })
  const [formError, setFormError] = useState('')
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null)

  const filtered = useMemo(() => {
    let res = [...despesas]
    if (filterCat !== 'all') res = res.filter((d) => d.categoria === filterCat)
    res.sort((a, b) =>
      sortDesc
        ? b.data_despesa!.localeCompare(a.data_despesa!)
        : a.data_despesa!.localeCompare(b.data_despesa!),
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
    setExistingFiles([])
    setNewFiles([])
    setFilesToRemove([])
    setEditingId(null)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (d: Despesa) => {
    setForm({
      data: d.data_despesa!.split('T')[0],
      categoria: d.categoria,
      descricao: d.descricao || '',
      valor: d.valor.toString(),
      moeda: d.moeda,
    })
    setExistingFiles(d.arquivos ? (Array.isArray(d.arquivos) ? d.arquivos : [d.arquivos]) : [])
    setNewFiles([])
    setFilesToRemove([])
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
      const formDataObj = new FormData()
      formDataObj.append('viagem_id', tripId)
      if (user?.id) formDataObj.append('usuario_id', user.id)
      formDataObj.append('categoria', form.categoria)
      formDataObj.append('descricao', form.descricao)
      formDataObj.append('valor', val.toString())
      formDataObj.append('moeda', form.moeda)
      formDataObj.append('data_despesa', new Date(form.data).toISOString())

      newFiles.forEach((f) => formDataObj.append('arquivos', f))
      filesToRemove.forEach((f) => formDataObj.append('arquivos-', f))

      if (editingId) {
        await updateDespesa(editingId, formDataObj)
        toast({ title: 'Despesa atualizada com sucesso!' })
      } else {
        await createDespesa(formDataObj)
        toast({ title: 'Despesa adicionada com sucesso!' })
      }
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
      toast({ title: 'Despesa deletada com sucesso!' })
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
        {filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
            <Receipt className="h-12 w-12 mb-4 text-slate-300" />
            <p className="mb-4">Nenhuma despesa encontrada</p>
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
                  <TableHead className="text-center">Moeda</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{format(parseISO(d.data_despesa!), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="capitalize">{d.categoria}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{d.descricao}</span>
                        {d.arquivos && d.arquivos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(Array.isArray(d.arquivos) ? d.arquivos : [d.arquivos]).map(
                              (f, i, arr) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    const url = pb.files.getURL(d, f)
                                    setPreviewFile({
                                      url,
                                      title: `Despesa - ${d.descricao || d.categoria} - PDF ${arr.length > 1 ? i + 1 : ''}`,
                                    })
                                  }}
                                  className="inline-flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-1.5 py-0.5 rounded"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  PDF {arr.length > 1 ? i + 1 : ''}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(d.valor, d.moeda)}
                    </TableCell>
                    <TableCell className="text-center">{d.moeda}</TableCell>
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

      <PdfViewerDialog
        url={previewFile?.url || null}
        title={previewFile?.title || ''}
        onClose={() => setPreviewFile(null)}
      />

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                      toast({
                        title: 'Formato inválido',
                        description: 'Apenas arquivos PDF são permitidos.',
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
