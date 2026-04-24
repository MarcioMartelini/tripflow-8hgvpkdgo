export interface OSRMLeg {
  distance: number // km
  duration: number // min
}

export interface OSRMRoute {
  distance: number // km
  duration: number // min
  legs: OSRMLeg[]
  geometry?: any
  geometries?: any[]
  waypoints?: any[]
}

export async function calculateRoute(
  events: { latitude?: number; longitude?: number; meio_transporte?: string; id: string }[],
  options: { overview?: 'false' | 'full'; geometries?: 'geojson' | 'polyline' } = {},
): Promise<OSRMRoute | null> {
  const validEvents = events.filter((e) => !!(e.latitude && e.longitude))
  if (validEvents.length < 2) return null

  let totalDistance = 0
  let totalDuration = 0
  const legs: OSRMLeg[] = []
  const geometries: any[] = []

  const overview = options.overview || 'false'
  const geomParam = options.geometries ? `&geometries=${options.geometries}` : ''

  await Promise.all(
    validEvents.slice(0, -1).map(async (ev, i) => {
      const next = validEvents[i + 1]
      const mode = ev.meio_transporte || 'carro'
      let profile = 'driving'
      let multiplier = 1
      if (mode === 'andando') profile = 'walking'
      if (mode === 'bicicleta') profile = 'cycling'
      if (mode === 'transporte_publico') {
        profile = 'driving'
        multiplier = 1.5
      }

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/${profile}/${ev.longitude},${ev.latitude};${next.longitude},${next.latitude}?overview=${overview}${geomParam}`,
        )
        const data = await res.json()
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const route = data.routes[0]
          const dist = route.distance / 1000
          const dur = (route.duration / 60) * multiplier

          totalDistance += dist
          totalDuration += dur

          legs[i] = { distance: dist, duration: dur }
          if (route.geometry) {
            geometries[i] = route.geometry
          }
        } else {
          legs[i] = { distance: 0, duration: 0 }
        }
      } catch (err) {
        console.error('OSRM fetch error:', err)
        legs[i] = { distance: 0, duration: 0 }
      }
    }),
  )

  return {
    distance: totalDistance,
    duration: totalDuration,
    legs,
    geometries: geometries.length > 0 ? geometries : undefined,
  }
}

export async function optimizeRoute(
  events: { latitude?: number; longitude?: number; meio_transporte?: string; id: string }[],
): Promise<(OSRMRoute & { waypoints: any[] }) | null> {
  const validEvents = events.filter((e) => !!(e.latitude && e.longitude))
  if (validEvents.length < 3) return null

  const mode = validEvents[0]?.meio_transporte || 'carro'
  let profile = 'driving'
  let multiplier = 1
  if (mode === 'andando') profile = 'walking'
  if (mode === 'bicicleta') profile = 'cycling'
  if (mode === 'transporte_publico') {
    profile = 'driving'
    multiplier = 1.5
  }

  const coords = validEvents.map((e) => `${e.longitude},${e.latitude}`).join(';')

  try {
    const res = await fetch(
      `https://router.project-osrm.org/trip/v1/${profile}/${coords}?source=first&roundtrip=false&overview=full&geometries=geojson`,
    )
    const data = await res.json()
    if (data.code === 'Ok' && data.trips?.length > 0) {
      const trip = data.trips[0]
      return {
        distance: trip.distance / 1000,
        duration: (trip.duration / 60) * multiplier,
        legs: trip.legs.map((l: any) => ({
          distance: l.distance / 1000,
          duration: (l.duration / 60) * multiplier,
        })),
        geometry: trip.geometry,
        waypoints: data.waypoints,
      }
    }
  } catch (err) {
    console.error('OSRM optimize error:', err)
  }
  return null
}
