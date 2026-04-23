import pb from '@/lib/pocketbase/client'

export interface Traveler {
  id: string
  viagem_id: string
  usuario_id?: string
  nome: string
  email?: string
  documento?: string
  created: string
  updated: string
}

export const getTravelers = (tripId: string) => {
  return pb.collection('viajantes').getFullList<Traveler>({
    filter: `viagem_id = "${tripId}"`,
    sort: '-created',
  })
}

export const createTraveler = (data: Partial<Traveler>) => {
  return pb.collection('viajantes').create<Traveler>(data)
}

export const deleteTraveler = (id: string) => {
  return pb.collection('viajantes').delete(id)
}
