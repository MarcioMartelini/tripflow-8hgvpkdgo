import pb from '@/lib/pocketbase/client'

export interface Traveler {
  id: string
  viagem_id: string
  usuario_id?: string
  nome: string
  email?: string
  documento?: string
}

export const getTravelers = async (tripId: string): Promise<Traveler[]> => {
  return await pb.collection('viajantes').getFullList<Traveler>({
    filter: `viagem_id = "${tripId}"`,
    sort: 'nome',
  })
}

export const createTraveler = async (data: Partial<Traveler>): Promise<Traveler> => {
  return await pb.collection('viajantes').create<Traveler>(data)
}

export const deleteTraveler = async (id: string): Promise<void> => {
  await pb.collection('viajantes').delete(id)
}
