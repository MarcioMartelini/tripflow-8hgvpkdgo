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
  File as FileIcon,
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
      return <FileIcon className="h-5 w-5 text-slate-500" />
  }
}

const getExpirationStatus = (dateStr?: string) => {
  if (!dateStr) {
    return {
      label: 'Válido',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
    }
  }
  const expDate = parseISO(dateStr)
  if (!isValid(expDate)) {
    return {
      label: 'Válido',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
    }
  }
  const daysDiff = differenceInDays(expDate, new Date())
  if (daysDiff < 0) {
    return {
      label: 'Documento expirado',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertCircle,
    }
  }
  if (daysDiff <= 30) {
    return {
      label: `Documento expira em ${daysDiff} dias`,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
    }
  }
  return {
    label: `Documento expira em ${daysDiff} dias`,
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
  const [fileError, setFileError] = useState('')
  const [tipo, setTipo] = useState('')
  const [dataExp, setDataExp] = useState('')
  const [dateError, setDateError] = useState('')
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

  const handleFileChange = (f: File | undefined) => {
    if (!f) {
      setFile(null)
      setFileError('')
      return
    }
    if (f.type !== 'application/pdf') {
      setFileError('Apenas arquivos PDF são aceitos')
      setFile(null)
      return
    }
    if (f.size > 5242880) {
      setFileError('Arquivo deve ter no máximo 5MB')
      setFile(null)
      return
    }
    setFileError('')
    setFile(f)
  }

  const handleDateChange = (val: string) => {
    setDataExp(val)
    if (!val) {
      setDateError('')
      return
    }
    const selected = parseISO(val)
    selected.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected < today) {
      setDateError('Data deve ser no futuro')
    } else {
      setDateError('')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !tipo || fileError || dateError) return

    setUploading(true)
    setUploadProgress(30)
    const fd = new FormData()
    fd.append('viagem_id', id!)
    fd.append('tipo', tipo)
    fd.append('nome_arquivo', file.name)
    fd.append('arquivo', file)
    if (dataExp) fd.append('data_expiracao', `${dataExp} 12:00:00.000Z`)
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
  const isSubmitDisabled = !file || !tipo || !!fileError || !!dateError || uploading

  if (error) {
    return (
      <div className="container py-16 text-center animate-fade-in flex flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900">Erro ao carregar documentos</h2>
        <p className="text-slate-500 mb-6">Tente novamente em alguns instantes</p>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
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
                {!tipo && file && <p className="text-sm text-red-500">Tipo é obrigatório</p>}
              </div>{' '}
              <div className="space-y-2">
                <Label>Arquivo PDF *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors ${fileError ? 'border-red-300' : 'border-slate-200'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileChange(e.dataTransfer.files?.[0])
                  }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <UploadCloud
                    className={`mx-auto h-8 w-8 mb-2 ${fileError ? 'text-red-400' : 'text-slate-400'}`}
                  />
                  {file ? (
                    <p className="text-sm font-medium text-primary truncate px-4">{file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Arraste o PDF aqui ou clique para selecionar
                      <br />
                      <span className="text-xs">Máx 5MB</span>
                    </p>
                  )}
                </div>
                {fileError && <p className="text-sm text-red-500">{fileError}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data de expiração</Label>
                <Input
                  type="date"
                  value={dataExp}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
                {dateError && <p className="text-sm text-red-500">{dateError}</p>}
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={notas}
                  maxLength={500}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Adicione observações sobre este documento"
                />
              </div>
              {uploading && <Progress value={uploadProgress} className="h-2" />}
              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                {uploading ? 'Enviando...' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
          <h3 className="text-xl font-semibold text-slate-900">Nenhum documento adicionado</h3>
          <p className="text-slate-500 mt-2 mb-6">Comece adicionando seus documentos de viagem</p>
          <Button onClick={() => setOpenUpload(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const exp = getExpirationStatus(doc.data_expiracao)
            const formattedDate =
              doc.data_expiracao && isValid(parseISO(doc.data_expiracao))
                ? format(parseISO(doc.data_expiracao), 'dd/MM/yyyy')
                : null

            return (
              <Card key={doc.id} className="animate-fade-in hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-slate-100 rounded-lg shrink-0">
                      {getTypeIcon(doc.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                        {doc.tipo}
                      </p>
                      <h3 className="font-medium text-slate-900 truncate" title={doc.nome_arquivo}>
                        {doc.nome_arquivo}
                      </h3>
                      {formattedDate && (
                        <p className="text-xs text-slate-500 mt-1">Expira em: {formattedDate}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t flex flex-col gap-4">
                    <Badge variant="outline" className={`w-fit flex gap-1.5 ${exp.color}`}>
                      <exp.icon className="h-3.5 w-3.5" /> {exp.label}
                    </Badge>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setViewDoc(doc)}>
                        <Eye className="h-4 w-4 mr-2" /> Visualizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{viewDoc?.nome_arquivo}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 rounded-md overflow-hidden relative">
            {viewDoc && (
              <object
                data={getDocumentUrl(viewDoc)}
                type="application/pdf"
                className="w-full h-full border-0"
              >
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center bg-slate-50">
                  <AlertCircle className="h-12 w-12 mb-4 text-slate-400" />
                  <p className="font-medium text-slate-700">Não foi possível visualizar o PDF.</p>
                  <p className="text-sm mt-2">Faça o download para acessar o arquivo localmente.</p>
                </div>
              </object>
            )}
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setViewDoc(null)}>
              Fechar
            </Button>
            {viewDoc && (
              <Button asChild>
                <a href={getDocumentUrl(viewDoc)} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este documento?
              <br />
              <span className="font-semibold text-red-600 block mt-2">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={async () => {
                if (deleteDoc) {
                  try {
                    await deleteDocument(deleteDoc.id)
                    toast({ title: 'Documento deletado com sucesso!' })
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
