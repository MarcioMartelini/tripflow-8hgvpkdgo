import pb from '@/lib/pocketbase/client'

export interface Trip {
  id: string
  title?: string
  nome?: string
  destination?: string
  destino?: string
  start_date?: string
  data_inicio?: string
  end_date?: string
  data_fim?: string
  status: string
  travelers_count?: number
  budget_total?: number
  orcamento_planejado?: number
  progress?: number
  moeda?: string
  descricao?: string
  owner_id: string
  latitude?: number
  longitude?: number
  created?: string
}

export const getTrips = async (): Promise<Trip[]> => {
  const user = pb.authStore.record
  if (!user) return []

  const ownedTrips = await pb.collection('trips').getFullList<Trip>({
    sort: '-created',
  })

  try {
    const travelerRecords = await pb.collection('viajantes').getFullList({
      filter: `usuario_id = "${user.id}"`,
      expand: 'viagem_id',
    })

    const travelerTrips = travelerRecords
      .map((record) => record.expand?.viagem_id as Trip)
      .filter((trip) => trip && !ownedTrips.find((t) => t.id === trip.id))

    return [...ownedTrips, ...travelerTrips].sort((a, b) => {
      const dateA = a.created || ''
      const dateB = b.created || ''
      return dateB.localeCompare(dateA)
    })
  } catch (e) {
    return ownedTrips
  }
}

export const getTrip = async (id: string): Promise<Trip> => {
  return await pb.collection('trips').getOne<Trip>(id)
}

export const createTrip = async (data: Partial<Trip>): Promise<Trip> => {
  if (!data.owner_id && pb.authStore.record) {
    data.owner_id = pb.authStore.record.id
  }
  return await pb.collection('trips').create<Trip>(data)
}

export const updateTrip = async (id: string, data: Partial<Trip>): Promise<Trip> => {
  return await pb.collection('trips').update<Trip>(id, data)
}
