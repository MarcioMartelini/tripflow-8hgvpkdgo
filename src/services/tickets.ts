import pb from '@/lib/pocketbase/client'

export interface Ticket {
  id: string
  viagem_id: string
  tipo: 'voo' | 'trem' | 'onibus' | 'outro'
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
  status?: 'confirmado' | 'pendente' | 'cancelado'
  created: string
  updated: string
}

export const getTickets = (viagemId: string) =>
  pb
    .collection('tickets')
    .getFullList<Ticket>({ filter: `viagem_id = "${viagemId}"`, sort: 'data_saida' })

export const createTicket = (data: Partial<Ticket>) => pb.collection('tickets').create<Ticket>(data)

export const updateTicket = (id: string, data: Partial<Ticket>) =>
  pb.collection('tickets').update<Ticket>(id, data)

export const deleteTicket = (id: string) => pb.collection('tickets').delete(id)
