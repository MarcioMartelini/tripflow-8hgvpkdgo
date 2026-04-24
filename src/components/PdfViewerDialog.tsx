import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PdfViewer } from '@/components/PdfViewer'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface PdfViewerDialogProps {
  url: string | null
  title: string
  onClose: () => void
}

export function PdfViewerDialog({ url, title, onClose }: PdfViewerDialogProps) {
  const finalUrl =
    url && !url.includes('token=') && !url.startsWith('blob:') && !url.startsWith('data:')
      ? `${url}${url.includes('?') ? '&' : '?'}token=${pb.authStore.token}`
      : url

  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-white flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate pr-4 flex-1 text-left">{title}</DialogTitle>
          <div className="flex items-center pr-6 shrink-0">
            {finalUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={finalUrl} target="_blank" rel="noreferrer" download>
                  <Download className="h-4 w-4 mr-2" /> Baixar
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden relative bg-slate-200/50">
          {finalUrl && <PdfViewer url={finalUrl} title={title} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
