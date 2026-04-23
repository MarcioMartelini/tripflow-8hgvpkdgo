import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getTripDocuments,
  createDocument,
  deleteDocument,
  getDocumentUrl,
  Documento,
} from '@/services/documentos'
import { getTrip, Trip } from '@/services/trips'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import {
  ArrowLeft,
  FileText,
  Trash2,
  Eye,
  Download,
  UploadCloud,
  File,
  Book,
  Shield,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react'

const getTypeIcon = (tipo: string) => {
  switch (tipo) {
    case 'passaporte':
      return <Book className="h-5 w-5 text-blue-500" />
    case 'visto':
      return <FileText className="h-5 w-5 text-purple-500" />
    case 'seguro':
      return <Shield className="h-5 w-5 text-green-500" />
    case 'comprovante':
      return <Receipt className="h-5 w-5 text-orange-500" />
    default:
      return <File className="h-5 w-5 text-slate-500" />
  }
}

const getExpirationStatus = (dateStr?: string) => {
  if (!dateStr)
    return {
      label: 'Válido',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
    }
  const expDate = parseISO(dateStr)
  if (!isValid(expDate))
    return {
      label: 'Válido',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
    }
  const daysDiff = differenceInDays(expDate, new Date())
  if (daysDiff < 0)
    return { label: 'Expirado', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle }
  if (daysDiff <= 30)
    return {
      label: `Expira em ${daysDiff} dias`,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
    }
  return {
    label: 'Válido',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  }
}

export default function TripDocuments() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('todos')

  const [viewDoc, setViewDoc] = useState<Documento | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<Documento | null>(null)

  const [openUpload, setOpenUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState('')
  const [dataExp, setDataExp] = useState('')
  const [notas, setNotas] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      const [t, d] = await Promise.all([getTrip(id), getTripDocuments(id)])
      setTrip(t)
      setDocs(d)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('documentos', () => {
    if (id) loadData()
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !tipo)
      return toast({ title: 'Preencha o tipo e selecione um arquivo', variant: 'destructive' })
    if (file.size > 5242880)
      return toast({ title: 'O arquivo excede o limite de 5MB.', variant: 'destructive' })
    if (file.type !== 'application/pdf')
      return toast({ title: 'Apenas arquivos PDF são permitidos.', variant: 'destructive' })

    setUploading(true)
    setUploadProgress(30)
    const fd = new FormData()
    fd.append('viagem_id', id!)
    fd.append('tipo', tipo)
    fd.append('nome_arquivo', file.name)
    fd.append('arquivo', file)
    if (dataExp) fd.append('data_expiracao', dataExp)
    if (notas) fd.append('notas', notas)

    try {
      await createDocument(fd)
      setUploadProgress(100)
      toast({ title: 'Documento adicionado com sucesso!' })
      setOpenUpload(false)
      setFile(null)
      setTipo('')
      setDataExp('')
      setNotas('')
      loadData()
    } catch {
      toast({ title: 'Erro ao fazer upload do documento.', variant: 'destructive' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const filteredDocs = docs.filter((d) => filter === 'todos' || d.tipo === filter)

  if (error) {
    return (
      <div className="container py-12 text-center animate-fade-in">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ocorreu um erro ao carregar os documentos</h2>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 animate-fade-in space-y-6">
      <Button variant="ghost" className="mb-2 -ml-4 text-slate-500" asChild>
        <Link to={`/trips/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Documentos</h1>
          <p className="text-slate-500 mt-1">Documentos privados da viagem {trip?.title}</p>
        </div>

        <Dialog open={openUpload} onOpenChange={setOpenUpload}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
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
                <Label>Arquivo *</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f && f.type === 'application/pdf') setFile(f)
                    else toast({ title: 'Apenas PDF é permitido', variant: 'destructive' })
                  }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFile(e.target.files[0])
                    }}
                  />
                  <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  {file ? (
                    <p className="text-sm font-medium text-primary">{file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Arraste o PDF aqui ou clique para selecionar
                      <br />
                      <span className="text-xs">Máx 5MB</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de expiração</Label>
                <Input type="date" value={dataExp} onChange={(e) => setDataExp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observações adicionais..."
                />
              </div>
              {uploading && <Progress value={uploadProgress} className="h-2" />}
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Salvar Documento'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['todos', 'passaporte', 'visto', 'seguro', 'comprovante', 'outro'].map((f) => (
          <Badge
            key={f}
            variant={filter === f ? 'default' : 'secondary'}
            className="capitalize cursor-pointer px-3 py-1 text-sm font-medium"
            onClick={() => setFilter(f)}
          >
            {f}
          </Badge>
        ))}
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-lg border-2 border-dashed">
          <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum documento adicionado</h3>
          <p className="text-slate-500 mt-1 mb-4 text-sm">
            Adicione passaportes, vistos e vouchers para acesso rápido.
          </p>
          <Button onClick={() => setOpenUpload(true)} variant="outline">
            Adicionar Documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const exp = getExpirationStatus(doc.data_expiracao)
            return (
              <Card key={doc.id} className="animate-fade-in hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                      {getTypeIcon(doc.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-sm truncate text-slate-900"
                        title={doc.nome_arquivo}
                      >
                        {doc.nome_arquivo}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">{doc.tipo}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t flex flex-col gap-3">
                    {doc.data_expiracao && (
                      <Badge variant="outline" className={`w-fit flex gap-1 ${exp.color}`}>
                        <exp.icon className="h-3 w-3" /> {exp.label}
                      </Badge>
                    )}
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="secondary" size="sm" onClick={() => setViewDoc(doc)}>
                        <Eye className="h-4 w-4 mr-1" /> Visualizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteDoc(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Viewer Modal */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewDoc?.nome_arquivo}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 rounded-md overflow-hidden relative">
            {viewDoc && (
              <iframe
                src={getDocumentUrl(viewDoc)}
                className="w-full h-full border-0"
                title={viewDoc.nome_arquivo}
              />
            )}
          </div>
          <DialogFooter className="mt-2">
            {viewDoc && (
              <Button asChild variant="default">
                <a href={getDocumentUrl(viewDoc)} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewDoc(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                if (deleteDoc) {
                  try {
                    await deleteDocument(deleteDoc.id)
                    toast({ title: 'Documento deletado com sucesso.' })
                    loadData()
                  } catch {
                    toast({ title: 'Erro ao deletar documento.', variant: 'destructive' })
                  }
                }
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
