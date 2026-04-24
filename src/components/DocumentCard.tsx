import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Documento, getDocumentUrl } from '@/services/documentos'
import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import { PdfViewerDialog } from '@/components/PdfViewerDialog'
import { Link } from 'react-router-dom'
import {
  FileText,
  Trash2,
  Edit,
  Eye,
  File as FileIcon,
  Book,
  Shield,
  Receipt,
  AlertCircle,
  Clock,
  Share2,
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
  if (!dateStr || !isValid(parseISO(dateStr))) return null
  const expDate = parseISO(dateStr)
  const daysDiff = differenceInDays(expDate, new Date())
  if (daysDiff < 0)
    return { label: 'Expirado', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle }
  if (daysDiff <= 30)
    return {
      label: 'Expirando em breve',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
    }
  return { label: 'Válido', color: 'bg-green-100 text-green-800 border-green-200', icon: Clock }
}

interface DocumentCardProps {
  doc: Documento
  onEdit: (doc: Documento) => void
  onDelete: (doc: Documento) => void
  onShare?: (doc: Documento) => void
}

export function DocumentCard({ doc, onEdit, onDelete, onShare }: DocumentCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const exp = getExpirationStatus(doc.data_expiracao)
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-slate-100 rounded-lg shrink-0">{getTypeIcon(doc.tipo)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              {doc.tipo}
            </p>
            <h3 className="font-medium text-slate-900 truncate" title={doc.nome_arquivo}>
              {doc.nome_arquivo}
            </h3>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Viagem: {doc.expand?.viagem_id?.title || 'Desconhecida'}
            </p>
          </div>
        </div>
        {doc.notas && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doc.notas}</p>}
        <div className="mt-auto pt-4 border-t flex flex-col gap-4">
          {exp && (
            <Badge variant="outline" className={`w-fit flex gap-1.5 ${exp.color}`}>
              <exp.icon className="h-3.5 w-3.5" /> {exp.label}
            </Badge>
          )}
          <div className="flex justify-end gap-2">
            {doc.iv ? (
              <Button variant="secondary" size="sm" asChild>
                <Link to={`/documents/${doc.viagem_id}`}>
                  <Shield className="h-4 w-4 mr-2" /> Cofre
                </Link>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewUrl(getDocumentUrl(doc))}
              >
                <Eye className="h-4 w-4 mr-2" /> Ver Arquivo
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(doc)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(doc)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <PdfViewerDialog
        url={previewUrl}
        title={doc.nome_arquivo}
        onClose={() => setPreviewUrl(null)}
      />
    </Card>
  )
}
