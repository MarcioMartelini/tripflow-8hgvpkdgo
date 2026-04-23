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

export const getItinerarioByTrip = (viagemId: string) => {
  return pb.collection('itinerario').getFullList<ItinerarioEvent>({
    filter: `viagem_id = "${viagemId}"`,
    sort: 'data,hora_inicio',
  })
}

export const createItinerario = (data: Partial<ItinerarioEvent>) =>
  pb.collection('itinerario').create<ItinerarioEvent>(data)

export const updateItinerario = (id: string, data: Partial<ItinerarioEvent>) =>
  pb.collection('itinerario').update<ItinerarioEvent>(id, data)

export const deleteItinerario = (id: string) => pb.collection('itinerario').delete(id)
