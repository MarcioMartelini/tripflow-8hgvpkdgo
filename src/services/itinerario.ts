import pb from '@/lib/pocketbase/client'
import type { Trip } from './trips'

export interface ItinerarioEvent {
  id: string
  viagem_id: string
  data: string
  hora_inicio: string
  hora_fim?: string
  atividade: string
  tipo: string
  local?: string
  notas?: string
  created: string
  updated: string
  expand?: {
    viagem_id: Trip
  }
}

export const getUpcomingItinerario = () => {
  const userId = pb.authStore.record?.id
  return pb.collection('itinerario').getList<ItinerarioEvent>(1, 5, {
    sort: 'data,hora_inicio',
    expand: 'viagem_id',
    filter: userId ? `viagem_id.owner_id = "${userId}"` : '',
  })
}
