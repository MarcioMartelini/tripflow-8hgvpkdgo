import { useEffect, useState } from 'react'
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  Documento,
} from '@/services/documentos'
import { getTrips, Trip } from '@/services/trips'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Plus } from 'lucide-react'
import { DocumentCard } from '@/components/DocumentCard'

export default function Documents() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<Documento[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState('todos')

  const [openModal, setOpenModal] = useState(false)
  const [editDoc, setEditDoc] = useState<Documento | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<Documento | null>(null)

  const [viagemId, setViagemId] = useState('')
  const [tipo, setTipo] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [dataExp, setDataExp] = useState('')
  const [notas, setNotas] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadData = async () => {
    try {
      const [d, t] = await Promise.all([getAllDocuments(), getTrips()])
      setDocs(d)
      setTrips(t)
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('documentos', loadData)

  const handleOpenModal = (doc?: Documento) => {
    if (doc) {
      setEditDoc(doc)
      setViagemId(doc.viagem_id)
      setTipo(doc.tipo)
      setNomeArquivo(doc.nome_arquivo)
      setDataExp(doc.data_expiracao ? doc.data_expiracao.split(' ')[0] : '')
      setNotas(doc.notas || '')
    } else {
      setEditDoc(null)
      setViagemId('')
      setTipo('')
      setNomeArquivo('')
      setDataExp('')
      setNotas('')
    }
    setFile(null)
    setFileError('')
    setOpenModal(true)
  }

  const handleFileChange = (f: File | undefined) => {
    if (!f) {
      setFile(null)
      setFileError('')
      return
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) {
      setFileError('Formato inválido (Apenas PDF, JPG, PNG)')
      return setFile(null)
    }
    setFileError('')
    setFile(f)
    if (!nomeArquivo) setNomeArquivo(f.name)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viagemId || !tipo || !nomeArquivo || (!file && !editDoc)) return

    setUploading(true)
    const fd = new FormData()
    fd.append('viagem_id', viagemId)
    fd.append('tipo', tipo)
    fd.append('nome_arquivo', nomeArquivo)
    if (dataExp) fd.append('data_expiracao', `${dataExp} 12:00:00.000Z`)
    if (notas) fd.append('notas', notas)
    if (file) fd.append('arquivo', file)

    try {
      if (editDoc) {
        await updateDocument(editDoc.id, fd)
        toast({ title: 'Documento atualizado com sucesso!' })
      } else {
        await createDocument(viagemId, fd)
        toast({ title: 'Documento adicionado com sucesso!' })
      }
      setOpenModal(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao salvar documento', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDoc) return
    try {
      await deleteDocument(deleteDoc.id)
      toast({ title: 'Documento removido com sucesso!' })
      loadData()
    } catch {
      toast({ title: 'Erro ao remover documento', variant: 'destructive' })
    } finally {
      setDeleteDoc(null)
    }
  }

  const filteredDocs = docs.filter((d) => filter === 'todos' || d.tipo === filter)

  if (loading)
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="container py-8 px-4 animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Documentos</h1>
          <p className="text-slate-500 mt-1">Gerencie seus documentos de viagem</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Documento
        </Button>
      </div>

      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="passaporte">Passaporte</SelectItem>
            <SelectItem value="visto">Visto</SelectItem>
            <SelectItem value="seguro">Seguro</SelectItem>
            <SelectItem value="comprovante">Comprovante</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900">Nenhum documento encontrado</h3>
          <Button onClick={() => handleOpenModal()} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onEdit={handleOpenModal} onDelete={setDeleteDoc} />
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDoc ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Viagem *</Label>
              <Select value={viagemId} onValueChange={setViagemId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a viagem" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passaporte">Passaporte</SelectItem>
                  <SelectItem value="visto">Visto</SelectItem>
                  <SelectItem value="seguro">Seguro</SelectItem>
                  <SelectItem value="comprovante">Comprovante</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Arquivo *</Label>
              <Input
                value={nomeArquivo}
                onChange={(e) => setNomeArquivo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Expiração</Label>
              <Input type="date" value={dataExp} onChange={(e) => setDataExp(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Arquivo {editDoc ? '(Opcional)' : '*'}</Label>
              <Input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                required={!editDoc}
              />
              {fileError && <p className="text-sm text-red-500">{fileError}</p>}
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observações opcionais"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenModal(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading || (!file && !editDoc) || !!fileError}>
                {uploading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
