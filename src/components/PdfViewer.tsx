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
      <iframe
        src={url}
        title={title}
        className="w-full h-full flex-1 border-0"
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  )
}
