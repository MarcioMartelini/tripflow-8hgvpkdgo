import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PdfViewer } from '@/components/PdfViewer'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface PdfViewerDialogProps {
  url: string | null
  title: string
  onClose: () => void
}

export function PdfViewerDialog({ url, title, onClose }: PdfViewerDialogProps) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-white flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate pr-4 flex-1 text-left">{title}</DialogTitle>
          <div className="flex items-center pr-6 shrink-0">
            {url && (
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noreferrer" download>
                  <Download className="h-4 w-4 mr-2" /> Baixar
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden relative bg-slate-200/50">
          {url && <PdfViewer url={url} title={title} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
