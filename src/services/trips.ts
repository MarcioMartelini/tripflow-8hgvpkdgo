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
}

export const getTrips = async (): Promise<Trip[]> => {
  return await pb.collection('trips').getFullList<Trip>({
    sort: '-created',
  })
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
