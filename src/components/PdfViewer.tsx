import { useState, useEffect } from 'react'
import { AlertCircle, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PdfViewerProps {
  url: string
  title: string
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown')

  const isValidUrl = Boolean(url && url.trim() !== '')

  useEffect(() => {
    if (!isValidUrl) {
      setLoading(false)
      setError(true)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(false)

    // Fetch the file as a Blob to bypass X-Frame-Options / CSP frame-ancestors
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.blob()
      })
      .then((blob) => {
        if (!isMounted) return

        const type = blob.type.toLowerCase()
        const isImg = type.startsWith('image/')
        const isPdf = type === 'application/pdf'

        const objUrl = URL.createObjectURL(blob)
        setObjectUrl(objUrl)
        setFileType(isImg ? 'image' : isPdf ? 'pdf' : 'unknown')
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load document:', err)
        if (!isMounted) return
        setError(true)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [url, isValidUrl])

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  if (!isValidUrl || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-500 p-8 text-center bg-slate-50">
        <AlertCircle className="h-12 w-12 mb-4 text-slate-400" />
        <p className="font-medium text-slate-700 mb-2">Não foi possível carregar o documento</p>
        <p className="text-sm text-slate-500 mb-4">
          O arquivo pode estar indisponível ou o formato não é suportado.
        </p>
        {isValidUrl && (
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noreferrer" download>
              <Download className="h-4 w-4 mr-2" /> Tentar Baixar
            </a>
          </Button>
        )}
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

      {objectUrl &&
        (fileType === 'image' ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <img
              src={objectUrl}
              alt={title}
              className="max-w-full max-h-full object-contain shadow-sm"
              onLoad={() => setLoading(false)}
              onError={() => setError(true)}
            />
          </div>
        ) : (
          <iframe
            src={objectUrl}
            title={title}
            className="w-full h-full flex-1 border-0 bg-white"
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
            allow="fullscreen"
          />
        ))}
    </div>
  )
}
