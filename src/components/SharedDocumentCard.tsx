import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompartilhamentoDocumento } from '@/services/compartilhamento_documentos'
import { getDocumentUrl } from '@/services/documentos'
import { format, parseISO } from 'date-fns'
import { Eye, FileText, Share2, File as FileIcon, Shield, Receipt, Book } from 'lucide-react'
import { useState } from 'react'
import { PdfViewerDialog } from '@/components/PdfViewerDialog'
import { Link } from 'react-router-dom'

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

export function SharedDocumentCard({ share }: { share: CompartilhamentoDocumento }) {
  const doc = share.expand?.documento_id
  const sharedBy = share.expand?.usuario_compartilhador?.name || 'Usuário Desconhecido'
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!doc) return null

  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-shadow border-blue-100 bg-blue-50/30">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-white rounded-lg shrink-0 border border-blue-100 shadow-sm">
            {getTypeIcon(doc.tipo)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              {doc.tipo}
            </p>
            <h3 className="font-medium text-slate-900 truncate" title={doc.nome_arquivo}>
              {doc.nome_arquivo}
            </h3>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
              <Share2 className="h-3 w-3" />
              <span className="truncate">
                Por {sharedBy} em {format(parseISO(share.created), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-blue-100/50 flex justify-end gap-2">
          {doc.iv ? (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link to={`/documents/${doc.viagem_id}`}>
                <Shield className="h-4 w-4 mr-2" /> Acessar Cofre
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setPreviewUrl(getDocumentUrl(doc))}
            >
              <Eye className="h-4 w-4 mr-2" /> Visualizar
            </Button>
          )}
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
