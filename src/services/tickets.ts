import pb from '@/lib/pocketbase/client'

export interface Ticket {
  id: string
  viagem_id: string
  tipo: string
  numero_confirmacao?: string
  origem?: string
  destino?: string
  data_saida?: string
  hora_saida?: string
  data_chegada?: string
  hora_chegada?: string
  companhia?: string
  preco?: number
  moeda?: string
  status?: string
}

export const getTickets = async (tripId: string): Promise<Ticket[]> => {
  return await pb.collection('tickets').getFullList<Ticket>({
    filter: `viagem_id = "${tripId}"`,
    sort: 'data_saida',
  })
}
