import { useEffect, useRef, useState, useMemo } from 'react'
import { ItinerarioEvent, updateItinerario } from '@/services/itinerario'
import { Trip } from '@/services/trips'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Route, Navigation, Car, Footprints, Train, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MapViewProps {
  events: ItinerarioEvent[]
  trip: Trip
  onEditEvent: (event: ItinerarioEvent) => void
  onUpdateEvent?: (id: string, data: Partial<ItinerarioEvent>) => Promise<void>
  onUpdateAllEvents?: (ids: string[], data: Partial<ItinerarioEvent>) => Promise<void>
}

interface RouteInfo {
  distance: number // in km
  duration: number // in min
  geometry?: any
  geometries?: any[]
  waypoints?: any[]
  legs?: { distance: number; duration: number }[]
}

const formatDuration = (mins: number) => {
  const m = Math.round(mins)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`
}

const getIconSvg = (tipo?: string) => {
  switch (tipo) {
    case 'voo':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3.5 3.5-2.2-.5L2 17l4.5 1 1 4.5 1-1.3-.5-2.2L11.5 15l5 6c.4-.2.7-.6.6-1.1z"/></svg>`
    case 'hotel':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>`
    case 'refeição':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
  }
}

const getColor = (tipo?: string) => {
  if (tipo === 'voo') return '#ef4444' // red
  if (tipo === 'hotel') return '#22c55e' // green
  if (tipo === 'refeição') return '#f97316' // orange
  return '#3b82f6' // blue (atividade)
}

export function MapView({
  events,
  trip,
  onEditEvent,
  onUpdateEvent,
  onUpdateAllEvents,
}: MapViewProps) {
  const { toast } = useToast()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [optimizedRouteInfo, setOptimizedRouteInfo] = useState<RouteInfo | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showOptimized, setShowOptimized] = useState(false)

  const validEvents = useMemo(() => {
    return events
      .filter((e) => e.latitude && e.longitude)
      .sort((a, b) => (a.hora_inicio || '24:00').localeCompare(b.hora_inicio || '24:00'))
  }, [events])

  const orderedEvents = useMemo(() => {
    if (!showOptimized || !optimizedRouteInfo?.waypoints) return validEvents
    const waypoints = [...optimizedRouteInfo.waypoints].sort(
      (a, b) => a.waypoint_index - b.waypoint_index,
    )
    return waypoints.map((wp) => validEvents[wp.original_index]).filter(Boolean)
  }, [validEvents, showOptimized, optimizedRouteInfo])

  const [transportMode, setTransportMode] = useState<string>('')

  const handleTransportModeChange = async (value: string) => {
    setTransportMode(value)
    try {
      if (onUpdateAllEvents) {
        const ids = validEvents.filter((ev) => ev.meio_transporte !== value).map((ev) => ev.id)
        if (ids.length > 0) {
          await onUpdateAllEvents(ids, { meio_transporte: value })
        }
      } else {
        await Promise.all(
          validEvents.map((ev) => {
            if (ev.meio_transporte !== value) {
              return updateItinerario(ev.id, { meio_transporte: value })
            }
          }),
        )
      }
      toast({ title: 'Meio de transporte de todas as atividades atualizado!' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar meio de transporte', variant: 'destructive' })
    }
  }

  const osrmProfile = useMemo(() => {
    const defaultMode = validEvents.length > 0 ? validEvents[0].meio_transporte || 'carro' : 'carro'
    if (defaultMode === 'andando' || defaultMode === 'transporte_publico') return 'foot'
    if (defaultMode === 'bicicleta') return 'bike'
    return 'driving'
  }, [validEvents])

  useEffect(() => {
    if ((window as any).L) {
      setLoaded(true)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => setLoaded(true)
    document.body.appendChild(script)
  }, [])

  // Calculate Original Route
  useEffect(() => {
    if (validEvents.length < 2) {
      setRouteInfo(null)
      return
    }
    const fetchRoute = async () => {
      try {
        let totalDistance = 0
        let totalDuration = 0
        const legs: any[] = []
        const geometries: any[] = []

        await Promise.all(
          validEvents.slice(0, -1).map(async (ev, i) => {
            const next = validEvents[i + 1]
            const mode = ev.meio_transporte || 'carro'
            let profile = 'driving'
            if (mode === 'andando' || mode === 'transporte_publico') profile = 'foot'
            if (mode === 'bicicleta') profile = 'bike'

            const res = await fetch(
              `https://router.project-osrm.org/route/v1/${profile}/${ev.longitude},${ev.latitude};${next.longitude},${next.latitude}?overview=full&geometries=geojson`,
            )
            const data = await res.json()
            if (data.code === 'Ok' && data.routes.length > 0) {
              const route = data.routes[0]
              totalDistance += route.distance / 1000
              totalDuration += route.duration / 60
              legs[i] = {
                distance: route.distance / 1000,
                duration: route.duration / 60,
              }
              geometries[i] = route.geometry
            } else {
              legs[i] = null
              geometries[i] = null
            }
          }),
        )

        setRouteInfo({
          distance: totalDistance,
          duration: totalDuration,
          geometries: geometries.filter(Boolean),
          legs: legs.filter(Boolean),
        })
      } catch (err) {
        console.error('Error fetching route', err)
      }
    }
    fetchRoute()
  }, [validEvents])

  const handleApplyOptimization = async () => {
    if (!optimizedRouteInfo?.waypoints) return
    const waypoints = [...optimizedRouteInfo.waypoints].sort(
      (a, b) => a.waypoint_index - b.waypoint_index,
    )
    const newOrder = waypoints.map((wp) => validEvents[wp.original_index]).filter(Boolean)

    const times = newOrder
      .map((e) => e.hora_inicio)
      .sort((a, b) => (a || '24:00').localeCompare(b || '24:00'))

    try {
      await Promise.all(
        newOrder.map((ev, i) => {
          if (ev.hora_inicio !== times[i]) {
            return updateItinerario(ev.id, { hora_inicio: times[i] })
          }
        }),
      )
      toast({ title: 'Rota otimizada aplicada com sucesso!' })
      setShowOptimized(false)
    } catch (e) {
      toast({ title: 'Erro ao aplicar otimização', variant: 'destructive' })
    }
  }

  // Optimize Route
  const handleOptimize = async () => {
    if (validEvents.length < 3) return
    setIsOptimizing(true)
    try {
      const coordinates = validEvents.map((e) => `${e.longitude},${e.latitude}`).join(';')
      const res = await fetch(
        `https://router.project-osrm.org/trip/v1/${osrmProfile}/${coordinates}?source=first&roundtrip=false&overview=full&geometries=geojson`,
      )
      const data = await res.json()
      if (data.code === 'Ok' && data.trips.length > 0) {
        setOptimizedRouteInfo({
          distance: data.trips[0].distance / 1000,
          duration: data.trips[0].duration / 60,
          geometry: data.trips[0].geometry,
          waypoints: data.waypoints,
          legs: data.trips[0].legs.map((leg: any) => ({
            distance: leg.distance / 1000,
            duration: leg.duration / 60,
          })),
        })
        setShowOptimized(true)
      }
    } catch (err) {
      console.error('Error optimizing route', err)
    } finally {
      setIsOptimizing(false)
    }
  }

  // Draw Map
  useEffect(() => {
    if (!loaded || !mapRef.current) return

    const L = (window as any).L

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { maxZoom: 18 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current)
    }

    const map = mapInstance.current

    // Clear existing markers and polylines
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
        map.removeLayer(layer)
      }
    })

    if (orderedEvents.length === 0) {
      if (trip.latitude && trip.longitude) {
        map.setView([trip.latitude, trip.longitude], 12)
      } else {
        map.setView([0, 0], 2)
      }
      return
    }

    const bounds = L.latLngBounds()

    orderedEvents.forEach((ev, index) => {
      if (!ev) return
      const lat = ev.latitude!
      const lng = ev.longitude!
      bounds.extend([lat, lng])

      const color = getColor(ev.tipo)

      const iconHtml = `
        <div style="position: relative;">
          <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            ${getIconSvg(ev.tipo)}
          </div>
          <div style="position: absolute; top: -8px; right: -8px; background: white; color: ${color}; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 1px solid ${color};">
            ${index + 1}
          </div>
        </div>
      `

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)

      const popupContent = document.createElement('div')
      popupContent.innerHTML = `
        <div style="min-width: 150px; font-family: sans-serif;">
          <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${ev.atividade}</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: capitalize;">${
            ev.tipo || 'Atividade'
          } • ${ev.hora_inicio || 'Horário a definir'}</p>
          <button id="edit-btn-${
            ev.id
          }" style="margin-top: 10px; background: #0f172a; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 12px; font-weight: 500; transition: background 0.2s;">Ver Detalhes</button>
        </div>
      `

      marker.bindPopup(popupContent)

      marker.on('popupopen', () => {
        const btn = document.getElementById(`edit-btn-${ev.id}`)
        if (btn) {
          btn.addEventListener('click', () => {
            onEditEvent(ev)
          })
        }
      })
    })

    // Draw route
    const currentRouteInfo = showOptimized ? optimizedRouteInfo : routeInfo
    if (currentRouteInfo) {
      if (currentRouteInfo.geometry) {
        const geojsonLayer = L.geoJSON(currentRouteInfo.geometry, {
          style: {
            color: showOptimized ? '#10b981' : '#3b82f6',
            weight: 4,
            opacity: 0.7,
            dashArray: showOptimized ? '10, 10' : '',
          },
        }).addTo(map)
        bounds.extend(geojsonLayer.getBounds())
      }
      if (currentRouteInfo.geometries) {
        currentRouteInfo.geometries.forEach((geom) => {
          if (geom) {
            const geojsonLayer = L.geoJSON(geom, {
              style: {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.7,
              },
            }).addTo(map)
            bounds.extend(geojsonLayer.getBounds())
          }
        })
      }
    }

    if (orderedEvents.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [loaded, orderedEvents, trip, onEditEvent, routeInfo, optimizedRouteInfo, showOptimized])

  if (validEvents.length === 0 && (!trip.latitude || !trip.longitude)) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 border rounded-lg p-6 text-center">
        <MapPin className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold mb-2 text-slate-700">Nenhuma localização neste dia</h3>
        <p className="text-slate-500 mb-6 max-w-md">
          Para ver suas atividades no mapa, adicione-as e preencha a localização de cada uma.
        </p>
      </div>
    )
  }

  const activeRoute = showOptimized ? optimizedRouteInfo : routeInfo
  const savings =
    routeInfo && optimizedRouteInfo ? routeInfo.distance - optimizedRouteInfo.distance : 0

  return (
    <div className="flex flex-col md:flex-row gap-4 animate-fade-in">
      <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-slate-500" />
              Resumo da Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">
                Mudar Meio de Transporte de Tudo
              </label>
              <Select value={transportMode} onValueChange={handleTransportModeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Aplicar em todos" />
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
                      <Train className="h-4 w-4" /> Transporte Público
                    </div>
                  </SelectItem>
                  <SelectItem value="bicicleta">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4" /> Bicicleta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {transportMode === 'transporte_publico' && (
                <p className="text-[10px] text-amber-600 font-medium">
                  *Tempo do transporte público usa base a pé para cálculo interno. O app de
                  navegação calculará corretamente.
                </p>
              )}
            </div>

            {activeRoute ? (
              activeRoute.distance === 0 && activeRoute.duration === 0 ? (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200 mt-2">
                  Não foi possível calcular a rota para as localizações selecionadas. Verifique se
                  os endereços são válidos e acessíveis.
                </div>
              ) : (
                <>
                  <div className="flex items-center bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex flex-col flex-1">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: '#54769F' }}
                      >
                        DISTÂNCIA TOTAL
                      </span>
                      <span className="font-bold text-xl text-slate-900 mt-0.5">
                        {activeRoute.distance > 0 ? `${activeRoute.distance.toFixed(1)} km` : '--'}
                      </span>
                    </div>
                    <div className="h-10 w-px bg-slate-200 mx-3"></div>
                    <div className="flex flex-col flex-1 pl-1">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: '#54769F' }}
                      >
                        TEMPO ESTIMADO
                      </span>
                      <span className="font-bold text-xl text-slate-900 mt-0.5">
                        {activeRoute.duration > 0 ? formatDuration(activeRoute.duration) : '--'}
                      </span>
                    </div>
                  </div>

                  {validEvents.length >= 3 && (
                    <div className="pt-2 border-t space-y-3">
                      {!showOptimized ? (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">
                            Suas atividades podem não estar na melhor ordem de deslocamento.
                          </p>
                          <Button
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <Route className="mr-2 h-4 w-4" />
                            {isOptimizing ? 'Otimizando...' : 'Otimizar Rota'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">
                            Rota Otimizada!
                          </Badge>
                          {savings > 0.1 && (
                            <p className="text-sm text-emerald-600 font-medium">
                              Você economiza {savings.toFixed(1)} km de deslocamento!
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              onClick={handleApplyOptimization}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Aplicar
                            </Button>
                            <Button
                              onClick={() => setShowOptimized(false)}
                              variant="outline"
                              className="w-full"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            ) : validEvents.length === 1 ? (
              <p className="text-sm text-slate-500">
                Adicione mais atividades com localização para ver a rota e o cálculo de distância.
              </p>
            ) : (
              <p className="text-sm text-slate-500">Calculando rota...</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-500 uppercase tracking-wider">
              {showOptimized ? 'Ordem Otimizada' : 'Ordem Cronológica'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto max-h-[300px] pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {orderedEvents.map((ev, i) => {
              const leg = activeRoute?.legs?.[i]
              return (
                <div key={ev.id} className="flex gap-3 items-start group">
                  <div className="flex flex-col items-center mt-1 min-h-[40px]">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: getColor(ev.tipo) }}
                    >
                      {i + 1}
                    </div>
                    {i < orderedEvents.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 my-1 group-last:hidden min-h-[30px]"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-sm text-slate-900 leading-tight">
                      {ev.atividade}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ev.hora_inicio || 'Sem horário'} • {ev.local || 'Local não definido'}
                    </p>
                    {leg && i < orderedEvents.length - 1 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {!showOptimized && (
                          <Select
                            value={ev.meio_transporte || 'carro'}
                            onValueChange={async (val) => {
                              try {
                                if (onUpdateEvent) {
                                  await onUpdateEvent(ev.id, { meio_transporte: val })
                                } else {
                                  await updateItinerario(ev.id, { meio_transporte: val })
                                }
                              } catch {
                                /* intentionally ignored */
                              }
                            }}
                          >
                            <SelectTrigger className="h-6 w-[130px] text-[10px] bg-slate-50 border-slate-200">
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
                                  <Bike className="h-3 w-3" /> Bike
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 w-fit px-2 py-0.5 rounded border">
                          <Navigation className="w-3 h-3 text-slate-400" />
                          {leg.distance.toFixed(1)} km • {formatDuration(leg.duration)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 h-[50vh] min-h-[400px] md:h-[600px] relative rounded-lg overflow-hidden border shadow-sm isolate">
        <div ref={mapRef} className="absolute inset-0" />
      </div>
    </div>
  )
}
