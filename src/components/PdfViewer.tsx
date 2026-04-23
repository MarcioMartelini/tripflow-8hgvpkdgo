import { useState, useEffect } from 'react'
import { AlertCircle, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PdfViewerProps {
  url: string
  title: string
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)

  const isValidUrl = Boolean(url && url.trim() !== '')

  useEffect(() => {
    if (!isValidUrl) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    setTimeoutReached(false)

    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [url, isValidUrl])

  if (!isValidUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-500 p-8 text-center bg-slate-50">
        <AlertCircle className="h-12 w-12 mb-4 text-slate-400" />
        <p className="font-medium text-slate-700">Arquivo não encontrado</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-500 p-8 text-center bg-slate-50">
        <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
        <p className="font-medium text-slate-700">Não foi possível visualizar o PDF.</p>
        <Button asChild className="mt-4">
          <a href={url} download target="_blank" rel="noreferrer">
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
      </div>
    )
  }

  if (timeoutReached && loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-500 p-8 text-center bg-slate-50">
        <AlertCircle className="h-12 w-12 mb-4 text-yellow-500" />
        <p className="font-medium text-slate-700 max-w-sm">
          Não conseguimos visualizar o PDF no navegador. Clique em Download para abrir.
        </p>
        <Button asChild className="mt-6" variant="default" size="lg">
          <a href={url} download target="_blank" rel="noreferrer">
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex-1">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-slate-500 font-medium">Carregando documento...</p>
        </div>
      )}
      <iframe
        src={`${url}#toolbar=0`}
        className={`w-full h-full border-0 ${loading ? 'invisible' : 'visible'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
        title={title}
      />
    </div>
  )
}
