import pb from '@/lib/pocketbase/client'

export interface Reserva {
  id: string
  viagem_id: string
  tipo: 'hotel' | 'restaurante' | 'atividade' | 'outro'
  nome: string
  local?: string
  data_checkin: string
  hora_checkin?: string
  data_checkout?: string
  hora_checkout?: string
  numero_confirmacao?: string
  preco?: number
  moeda?: string
  status?: 'confirmado' | 'pendente' | 'cancelado'
  notas?: string
  created: string
  updated: string
}

export const getReservas = (viagemId: string) =>
  pb
    .collection('reservas')
    .getFullList<Reserva>({ filter: `viagem_id = "${viagemId}"`, sort: 'data_checkin' })

export const createReserva = (data: Partial<Reserva>) =>
  pb.collection('reservas').create<Reserva>(data)

export const updateReserva = (id: string, data: Partial<Reserva>) =>
  pb.collection('reservas').update<Reserva>(id, data)

export const deleteReserva = (id: string) => pb.collection('reservas').delete(id)
