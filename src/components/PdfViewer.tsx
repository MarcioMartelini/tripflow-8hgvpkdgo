import { useState, useEffect } from 'react'
import { AlertCircle, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PdfViewerProps {
  url: string
  title: string
}

import pb from '@/lib/pocketbase/client'

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown')

  const isValidUrl = Boolean(url && url.trim() !== '')

  const finalUrl =
    isValidUrl && !url.includes('token=') && !url.startsWith('data:')
      ? `${url}${url.includes('?') ? '&' : '?'}token=${pb.authStore.token}`
      : url

  useEffect(() => {
    if (!isValidUrl) {
      setLoading(false)
      setError(true)
      return
    }

    setLoading(true)
    setError(false)

    try {
      const urlWithoutQuery = finalUrl.split('?')[0].toLowerCase()
      const isImg = urlWithoutQuery.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) != null

      if (isImg) {
        setFileType('image')
      } else {
        // Fallback to pdf embed, since most non-image docs uploaded here are PDFs
        setFileType('pdf')
      }
    } catch (e) {
      console.error('Error determining file type', e)
      setFileType('pdf')
    }
  }, [finalUrl, isValidUrl])

  const handleLoad = () => setLoading(false)
  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  // Use a short timeout to hide the loading spinner for PDFs, since embed onload isn't consistently fired across all browsers
  useEffect(() => {
    if (fileType === 'pdf' && isValidUrl) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [fileType, isValidUrl])

  if (!isValidUrl || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-500 p-8 text-center bg-slate-50">
        <AlertCircle className="h-12 w-12 mb-4 text-slate-400" />
        <p className="font-medium text-slate-700 mb-2">Documento não disponível</p>
        <p className="text-sm text-slate-500 mb-4">
          O arquivo pode estar indisponível ou o formato não é suportado.
        </p>
        {isValidUrl && (
          <Button asChild variant="outline">
            <a href={finalUrl} target="_blank" rel="noreferrer" download>
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

      {fileType === 'image' ? (
        <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
          <img
            src={finalUrl}
            alt={title}
            className="max-w-full max-h-full object-contain shadow-sm"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      ) : (
        <iframe
          src={finalUrl}
          title={title}
          className="w-full h-full min-h-[70vh] flex-1 border-0 bg-white"
          width="100%"
          height="100%"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}
