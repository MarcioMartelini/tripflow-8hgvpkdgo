import pb from '@/lib/pocketbase/client'

export type TripStatus = 'planned' | 'ongoing' | 'completed'

export interface Trip {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  owner_id: string
  status: TripStatus
  travelers_count?: number
  budget_total?: number
  progress?: number
  created: string
  updated: string
}

export const getTrips = () => pb.collection('trips').getFullList<Trip>({ sort: '-created' })

export const getTrip = (id: string) => pb.collection('trips').getOne<Trip>(id)

export const createTrip = (data: Partial<Trip>) => {
  data.owner_id = pb.authStore.record?.id
  return pb.collection('trips').create<Trip>(data)
}

export const updateTrip = (id: string, data: Partial<Trip>) =>
  pb.collection('trips').update<Trip>(id, data)

export const deleteTrip = (id: string) => pb.collection('trips').delete(id)
