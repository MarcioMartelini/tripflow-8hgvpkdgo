import pb from '@/lib/pocketbase/client'

export interface Reserva {
  id: string
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
  arquivo?: string
}

export const getReservas = async (tripId: string): Promise<Reserva[]> => {
  return await pb.collection('reservas').getFullList<Reserva>({
    filter: `viagem_id = "${tripId}"`,
  })
}
