import { useState, useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

interface PdfViewerProps {
  url: string
  title: string
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const isValidUrl = Boolean(url && url.trim() !== '')

  useEffect(() => {
    if (!isValidUrl) {
      setLoading(false)
      return
    }
    setLoading(true)
  }, [url, isValidUrl])

  if (!isValidUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-500 p-8 text-center bg-slate-50">
        <AlertCircle className="h-12 w-12 mb-4 text-slate-400" />
        <p className="font-medium text-slate-700">Arquivo não encontrado</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden bg-slate-200/50 flex flex-col">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-slate-500 font-medium">Carregando documento...</p>
        </div>
      )}
      <object
        data={url}
        type="application/pdf"
        className="w-full h-full flex-1 border-0"
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      >
        <iframe
          src={url}
          title={title}
          className="w-full h-full flex-1 border-0"
          onLoad={() => setLoading(false)}
        >
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8 text-center">
            <AlertCircle className="h-12 w-12 mb-4 text-slate-400" />
            <p className="text-slate-600 mb-4 font-medium">
              Seu navegador não suporta a visualização direta de PDFs.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center"
            >
              Baixar Documento
            </a>
          </div>
        </iframe>
      </object>
    </div>
  )
}
