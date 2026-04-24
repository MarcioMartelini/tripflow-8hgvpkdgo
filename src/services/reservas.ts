import pb from '@/lib/pocketbase/client'

export interface Reserva {
  id: string
  collectionId: string
  collectionName: string
  viagem_id: string
  tipo: string
  nome: string
  local?: string
  data_checkin: string
  hora_checkin?: string
  data_checkout?: string
  hora_checkout?: string
  numero_confirmacao?: string
  preco?: number
  moeda?: string
  status?: string
  notas?: string
  arquivo?: string | File | null
}

export const getReservas = async (tripId: string): Promise<Reserva[]> => {
  return await pb.collection('reservas').getFullList<Reserva>({
    filter: `viagem_id = "${tripId}"`,
    sort: 'data_checkin',
  })
}

export const createReserva = async (data: any): Promise<Reserva> => {
  return await pb.collection('reservas').create<Reserva>(data)
}

export const updateReserva = async (id: string, data: any): Promise<Reserva> => {
  return await pb.collection('reservas').update<Reserva>(id, data)
}

export const deleteReserva = async (id: string): Promise<void> => {
  await pb.collection('reservas').delete(id)
}
