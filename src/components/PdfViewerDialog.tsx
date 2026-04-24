import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PdfViewer } from '@/components/PdfViewer'

interface PdfViewerDialogProps {
  url: string | null
  title: string
  onClose: () => void
}

export function PdfViewerDialog({ url, title, onClose }: PdfViewerDialogProps) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-white">
          <DialogTitle className="truncate pr-6">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden relative bg-slate-200/50">
          {url && <PdfViewer url={url} title={title} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
