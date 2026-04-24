import { useEffect, useRef, useState } from 'react'
import { ItinerarioEvent } from '@/services/itinerario'
import { Trip } from '@/services/trips'
import { MapPin } from 'lucide-react'

interface MapViewProps {
  events: ItinerarioEvent[]
  trip: Trip
  onEditEvent: (event: ItinerarioEvent) => void
}

export function MapView({ events, trip, onEditEvent }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

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

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    const validEvents = events.filter((e) => e.latitude && e.longitude)

    if (validEvents.length === 0) {
      if (trip.latitude && trip.longitude) {
        map.setView([trip.latitude, trip.longitude], 12)
      } else {
        map.setView([0, 0], 2)
      }
      return
    }

    const bounds = L.latLngBounds()

    validEvents.forEach((ev) => {
      const lat = ev.latitude!
      const lng = ev.longitude!
      bounds.extend([lat, lng])

      let color = '#3b82f6' // blue
      if (ev.tipo === 'voo') color = '#ef4444' // red
      if (ev.tipo === 'hotel') color = '#22c55e' // green
      if (ev.tipo === 'refeição') color = '#f97316' // orange

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)

      const popupContent = document.createElement('div')
      popupContent.innerHTML = `
        <div style="min-width: 150px; font-family: sans-serif;">
          <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${ev.atividade}</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b;">${ev.hora_inicio || ''} - ${ev.local || 'Sem local'}</p>
          <button id="edit-btn-${ev.id}" style="margin-top: 10px; background: #0f172a; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 12px; font-weight: 500; transition: background 0.2s;">Ver Detalhes</button>
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

    if (validEvents.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [loaded, events, trip, onEditEvent])

  const validEvents = events.filter((e) => e.latitude && e.longitude)

  if (validEvents.length === 0 && (!trip.latitude || !trip.longitude)) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 border rounded-lg p-6 text-center">
        <MapPin className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold mb-2 text-slate-700">Nenhuma localização no mapa</h3>
        <p className="text-slate-500 mb-6 max-w-md">
          Para ver suas atividades no mapa, edite-as e adicione a latitude e longitude. Ou configure
          as coordenadas do destino da sua viagem.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] md:h-[600px] relative rounded-lg overflow-hidden border shadow-sm isolate">
      <div ref={mapRef} className="absolute inset-0" />
    </div>
  )
}
