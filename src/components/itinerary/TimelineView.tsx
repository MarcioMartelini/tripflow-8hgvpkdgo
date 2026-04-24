import { useState } from 'react'
import { ItinerarioEvent } from '@/services/itinerario'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PdfViewerDialog } from '@/components/PdfViewerDialog'
import {
  Plane,
  Bed,
  Camera,
  Utensils,
  CircleDot,
  MapPin,
  Edit2,
  Trash2,
  CalendarX,
  FileText,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface TimelineViewProps {
  events: ItinerarioEvent[]
  onEdit: (event: ItinerarioEvent) => void
  onDelete: (event: ItinerarioEvent) => void
  onAdd: () => void
}

const getIcon = (tipo: string) => {
  switch (tipo) {
    case 'voo':
      return <Plane className="h-4 w-4" />
    case 'hotel':
      return <Bed className="h-4 w-4" />
    case 'atividade':
      return <Camera className="h-4 w-4" />
    case 'refeição':
      return <Utensils className="h-4 w-4" />
    default:
      return <CircleDot className="h-4 w-4" />
  }
}

export function TimelineView({ events, onEdit, onDelete, onAdd }: TimelineViewProps) {
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null)

  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed rounded-lg shadow-sm">
        <div className="bg-slate-50 inline-flex p-4 rounded-full mb-4">
          <CalendarX className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-700">Nenhum atividade neste dia</h3>
        <p className="text-slate-500 mt-1 max-w-sm mx-auto mb-6">
          Você ainda não planejou nada para esta data. Adicione atividades para organizar sua
          viagem.
        </p>
        <Button onClick={onAdd}>Adicionar Atividade</Button>
      </div>
    )
  }

  return (
    <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 py-4 animate-fade-in">
      {events.map((event) => (
        <div key={event.id} className="relative group">
          <div className="absolute -left-[35px] top-1 bg-white border-2 border-primary text-primary rounded-full p-1.5 shadow-sm">
            {getIcon(event.tipo)}
          </div>
          <Card className="ml-2 hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                    {event.hora_inicio} {event.hora_fim && `- ${event.hora_fim}`}
                  </span>
                  <span className="text-xs text-slate-500 capitalize px-2 py-0.5 bg-slate-50 border rounded">
                    {event.tipo}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">{event.atividade}</h4>
                {event.local && (
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {event.local}
                  </p>
                )}
                {event.notas && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded mt-2 whitespace-pre-wrap">
                    {event.notas}
                  </p>
                )}
                {event.arquivos && event.arquivos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Array.isArray(event.arquivos) ? event.arquivos : [event.arquivos]).map(
                      (arquivo, idx, arr) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const url = pb.files.getURL(event as any, arquivo)
                            setPreviewFile({
                              url,
                              title: `Itinerário - ${event.atividade} - PDF ${arr.length > 1 ? idx + 1 : ''}`,
                            })
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors border border-slate-200"
                          title={arquivo}
                        >
                          <FileText className="h-3.5 w-3.5 text-red-500" />
                          <span className="truncate max-w-[150px]">
                            PDF {arr.length > 1 ? idx + 1 : ''}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                  <Edit2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(event)}
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Deletar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      <PdfViewerDialog
        url={previewFile?.url || null}
        title={previewFile?.title || ''}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}
