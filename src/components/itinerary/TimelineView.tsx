import { useState, useEffect } from 'react'
import { ItinerarioEvent, updateItinerario } from '@/services/itinerario'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PdfViewerDialog } from '@/components/PdfViewerDialog'
import { useToast } from '@/hooks/use-toast'
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
  CalendarCheck,
  Navigation,
  Route,
  Car,
  Footprints,
  Train,
  Bike,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { ActivityComments } from './ActivityComments'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formatDuration = (mins: number) => {
  const m = Math.round(mins)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`
}

interface TimelineViewProps {
  events: ItinerarioEvent[]
  onEdit: (event: ItinerarioEvent) => void
  onDelete: (event: ItinerarioEvent) => void
  onAdd: () => void
  onUpdateEvent?: (id: string, data: Partial<ItinerarioEvent>) => Promise<void>
  onUpdateAllEvents?: (ids: string[], data: Partial<ItinerarioEvent>) => Promise<void>
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

export function TimelineView({
  events,
  onEdit,
  onDelete,
  onAdd,
  onUpdateEvent,
  onUpdateAllEvents,
}: TimelineViewProps) {
  const { toast } = useToast()
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [legs, setLegs] = useState<Record<string, { distance: number; duration: number }>>({})

  const [isOptimizing, setIsOptimizing] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    optimized: ItinerarioEvent[]
    savings: number
  } | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const fetchRoute = async () => {
      const valid = events.filter((e) => e.latitude && e.longitude)
      if (valid.length < 2) return

      const newLegs: Record<string, { distance: number; duration: number }> = {}

      await Promise.all(
        valid.slice(0, -1).map(async (ev, i) => {
          const next = valid[i + 1]
          const mode = ev.meio_transporte || 'carro'
          let profile = 'driving'
          if (mode === 'andando' || mode === 'transporte_publico') profile = 'foot'
          if (mode === 'bicicleta') profile = 'bike'

          try {
            const res = await fetch(
              `https://router.project-osrm.org/route/v1/${profile}/${ev.longitude},${ev.latitude};${next.longitude},${next.latitude}?overview=false`,
            )
            const data = await res.json()
            if (data.code === 'Ok' && data.routes?.[0]) {
              newLegs[`${ev.id}-${next.id}`] = {
                distance: data.routes[0].distance / 1000,
                duration: data.routes[0].duration / 60,
              }
            }
          } catch (e) {
            console.error('Error fetching distance for leg', e)
          }
        }),
      )
      setLegs(newLegs)
    }
    fetchRoute()
  }, [events])

  const handleOptimize = async () => {
    const valid = events.filter((e) => e.latitude && e.longitude)
    if (valid.length < 3) {
      toast({ title: 'Adicione pelo menos 3 locais para otimizar.' })
      return
    }
    setIsOptimizing(true)

    const mode = valid[0]?.meio_transporte || 'carro'
    let profile = 'driving'
    if (mode === 'andando' || mode === 'transporte_publico') profile = 'foot'
    if (mode === 'bicicleta') profile = 'bike'

    try {
      const coords = valid.map((e) => `${e.longitude},${e.latitude}`).join(';')
      const res = await fetch(
        `https://router.project-osrm.org/trip/v1/${profile}/${coords}?source=first&roundtrip=false`,
      )
      const data = await res.json()
      if (data.code === 'Ok' && data.trips?.[0]) {
        const optimizedDistance = data.trips[0].distance / 1000

        const resOrig = await fetch(
          `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=false`,
        )
        const dataOrig = await resOrig.json()
        const origDistance = dataOrig.routes?.[0]?.distance / 1000 || 0

        const savings = origDistance - optimizedDistance

        if (savings > 0.1) {
          const waypoints = data.waypoints.sort(
            (a: any, b: any) => a.waypoint_index - b.waypoint_index,
          )
          const newOrder = waypoints.map((wp: any) => valid[wp.original_index])
          setSuggestion({ optimized: newOrder, savings })
        } else {
          toast({ title: 'A rota já está na melhor ordem possível!' })
        }
      }
    } catch (e) {
      toast({ title: 'Erro ao otimizar', variant: 'destructive' })
    } finally {
      setIsOptimizing(false)
    }
  }

  const applyOptimization = async () => {
    if (!suggestion) return
    const times = suggestion.optimized
      .map((e) => e.hora_inicio)
      .sort((a, b) => (a || '24:00').localeCompare(b || '24:00'))

    try {
      await Promise.all(
        suggestion.optimized.map((ev, i) => {
          if (ev.hora_inicio !== times[i]) {
            return updateItinerario(ev.id, { hora_inicio: times[i] })
          }
        }),
      )
      toast({ title: 'Rota otimizada aplicada com sucesso!' })
      setSuggestion(null)
    } catch (e) {
      toast({ title: 'Erro ao aplicar otimização', variant: 'destructive' })
    }
  }

  const validEvents = events.filter((e) => e.latitude && e.longitude)
  const totalDistance = Object.values(legs).reduce((acc, leg) => acc + leg.distance, 0)
  const totalDuration = Object.values(legs).reduce((acc, leg) => acc + leg.duration, 0)

  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed rounded-lg shadow-sm">
        <div className="bg-slate-50 inline-flex p-4 rounded-full mb-4">
          <CalendarX className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-700">Nenhuma atividade neste dia</h3>
        <p className="text-slate-500 mt-1 max-w-sm mx-auto mb-6">
          Você ainda não planejou nada para esta data. Adicione atividades para organizar sua
          viagem.
        </p>
        <Button onClick={onAdd}>Adicionar Atividade</Button>
      </div>
    )
  }

  const validCount = validEvents.length

  return (
    <div className="animate-fade-in">
      {validCount >= 2 && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 sm:p-5 rounded-xl mb-6 border shadow-sm gap-4">
          {totalDistance === 0 && totalDuration === 0 ? (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200 w-full lg:w-auto flex-1">
              Não foi possível calcular a rota para as localizações selecionadas. Verifique se os
              endereços são válidos e acessíveis pelo transporte.
            </div>
          ) : (
            <div className="flex items-center w-full lg:w-auto">
              <div className="flex flex-col flex-1 lg:flex-none">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: '#54769F' }}
                >
                  DISTÂNCIA TOTAL
                </span>
                <span className="font-bold text-2xl text-slate-900 mt-0.5">
                  {totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '--'}
                </span>
              </div>
              <div className="h-10 w-px bg-slate-200 mx-4 sm:mx-6"></div>
              <div className="flex flex-col flex-1 lg:flex-none">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: '#54769F' }}
                >
                  TEMPO ESTIMADO
                </span>
                <span className="font-bold text-2xl text-slate-900 mt-0.5">
                  {totalDuration > 0 ? formatDuration(totalDuration) : '--'}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <Select
              value={validEvents[0]?.meio_transporte || 'carro'}
              onValueChange={async (val) => {
                try {
                  if (onUpdateAllEvents) {
                    const ids = validEvents
                      .filter((ev) => ev.meio_transporte !== val)
                      .map((ev) => ev.id)
                    if (ids.length > 0) {
                      await onUpdateAllEvents(ids, { meio_transporte: val })
                    }
                  } else {
                    await Promise.all(
                      validEvents.map((ev) => {
                        if (ev.meio_transporte !== val) {
                          return updateItinerario(ev.id, { meio_transporte: val })
                        }
                      }),
                    )
                  }
                  toast({ title: 'Meio de transporte atualizado para o dia!' })
                } catch (e) {
                  toast({ title: 'Erro ao atualizar meio de transporte', variant: 'destructive' })
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 h-10">
                <SelectValue placeholder="Meio de Transporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carro">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" /> Carro
                  </div>
                </SelectItem>
                <SelectItem value="andando">
                  <div className="flex items-center gap-2">
                    <Footprints className="h-4 w-4" /> A Pé
                  </div>
                </SelectItem>
                <SelectItem value="transporte_publico">
                  <div className="flex items-center gap-2">
                    <Train className="h-4 w-4" /> Público
                  </div>
                </SelectItem>
                <SelectItem value="bicicleta">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4" /> Bicicleta
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {validCount >= 3 && !suggestion && (
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing}
                variant="outline"
                className="shrink-0 bg-white h-10 w-full sm:w-auto"
              >
                <Route className="w-4 h-4 mr-2 text-indigo-500" />
                {isOptimizing ? 'Calculando...' : 'Otimizar Rota'}
              </Button>
            )}
          </div>
        </div>
      )}

      {suggestion && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-emerald-800">Sugestão de Rota</h4>
          <p className="text-sm text-emerald-700 mb-3">
            Reordenar para:{' '}
            <span className="font-medium">
              {suggestion.optimized.map((e) => e.atividade).join(' → ')}
            </span>
            <br />
            Economia estimada: <span className="font-bold">{suggestion.savings.toFixed(1)} km</span>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={applyOptimization}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Aplicar Nova Ordem
            </Button>
            <Button
              onClick={() => setSuggestion(null)}
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 py-4">
        {events.map((event, index) => {
          const isExpanded = expandedIds.has(event.id)

          // Find next event with coordinates to show leg
          let leg = null
          if (event.latitude && event.longitude) {
            for (let i = index + 1; i < events.length; i++) {
              if (events[i].latitude && events[i].longitude) {
                leg = legs[`${event.id}-${events[i].id}`]
                break
              }
            }
          }

          return (
            <div key={event.id} className="relative group flex flex-col gap-2">
              <div className="absolute -left-[35px] top-1 bg-white border-2 border-primary text-primary rounded-full p-1.5 shadow-sm">
                {getIcon(event.tipo)}
              </div>
              <Card
                className={cn(
                  'ml-2 transition-all hover:shadow-md',
                  isExpanded ? 'ring-1 ring-slate-200' : '',
                )}
              >
                <CardContent className="p-0">
                  <div
                    className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start cursor-pointer"
                    onClick={() => toggleExpand(event.id)}
                  >
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          {event.hora_inicio || '--:--'} {event.hora_fim && `- ${event.hora_fim}`}
                        </span>
                        <span className="text-xs text-slate-500 capitalize px-2 py-0.5 bg-slate-50 border rounded">
                          {event.tipo}
                        </span>
                        {(event as any).google_event_id && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded flex items-center gap-1">
                            <CalendarCheck className="w-3 h-3" />
                            Sincronizado
                          </span>
                        )}
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const url = pb.files.getURL(event as any, arquivo)
                                  setPreviewFile({
                                    url,
                                    title: `Itinerário - ${event.atividade} - PDF ${
                                      arr.length > 1 ? idx + 1 : ''
                                    }`,
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
                    <div
                      className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                  </div>

                  {isExpanded && (
                    <div
                      className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActivityComments atividadeId={event.id} tripId={event.viagem_id} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {leg && (
                <div className="ml-6 py-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <Select
                      value={event.meio_transporte || 'carro'}
                      onValueChange={async (val) => {
                        try {
                          if (onUpdateEvent) {
                            await onUpdateEvent(event.id, { meio_transporte: val })
                          } else {
                            await updateItinerario(event.id, { meio_transporte: val })
                          }
                        } catch {
                          /* intentionally ignored */
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carro">
                          <div className="flex items-center gap-2">
                            <Car className="h-3 w-3" /> Carro
                          </div>
                        </SelectItem>
                        <SelectItem value="andando">
                          <div className="flex items-center gap-2">
                            <Footprints className="h-3 w-3" /> A Pé
                          </div>
                        </SelectItem>
                        <SelectItem value="transporte_publico">
                          <div className="flex items-center gap-2">
                            <Train className="h-3 w-3" /> Público
                          </div>
                        </SelectItem>
                        <SelectItem value="bicicleta">
                          <div className="flex items-center gap-2">
                            <Bike className="h-3 w-3" /> Bicicleta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>{leg.distance.toFixed(1)} km</span>
                    <span className="opacity-50">•</span>
                    <span>{formatDuration(leg.duration)}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <PdfViewerDialog
        url={previewFile?.url || null}
        title={previewFile?.title || ''}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}
