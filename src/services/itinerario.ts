import pb from '@/lib/pocketbase/client'

export interface ItinerarioEvent {
  id: string
  collectionId: string
  collectionName: string
  viagem_id: string
  data: string
  hora_inicio?: string
  hora_fim?: string
  atividade: string
  tipo: string
  local?: string
  notas?: string
  arquivos?: string[]
  expand?: any

  // Aliases for backward compatibility in some components
  date?: string
  time?: string
  type?: string
  description?: string
}

export const getItinerarioByTrip = async (tripId: string): Promise<ItinerarioEvent[]> => {
  const records = await pb.collection('itinerario').getFullList<ItinerarioEvent>({
    filter: `viagem_id = "${tripId}"`,
    sort: 'data,hora_inicio',
  })
  return records.map((r) => ({
    ...r,
    date: r.data,
    type: r.tipo,
    time: r.hora_inicio,
    description: r.atividade,
  }))
}

export const getUpcomingItinerario = async (): Promise<{ items: ItinerarioEvent[] }> => {
  const today = new Date().toISOString().split('T')[0]
  const result = await pb.collection('itinerario').getList<ItinerarioEvent>(1, 10, {
    filter: `data >= "${today}"`,
    sort: 'data,hora_inicio',
    expand: 'viagem_id',
  })

  return {
    items: result.items.map((r) => ({
      ...r,
      date: r.data,
      type: r.tipo,
      time: r.hora_inicio,
      description: r.atividade,
    })),
  }
}

export const createItinerario = async (
  data: Partial<ItinerarioEvent> | FormData,
): Promise<ItinerarioEvent> => {
  return await pb.collection('itinerario').create<ItinerarioEvent>(data)
}

export const updateItinerario = async (
  id: string,
  data: Partial<ItinerarioEvent> | FormData,
): Promise<ItinerarioEvent> => {
  return await pb.collection('itinerario').update<ItinerarioEvent>(id, data)
}

export const deleteItinerario = async (id: string): Promise<void> => {
  await pb.collection('itinerario').delete(id)
}
