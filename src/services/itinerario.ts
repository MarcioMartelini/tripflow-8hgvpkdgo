import pb from '@/lib/pocketbase/client'
import { saveOfflineOp, getOfflineOps, removeOfflineOp } from '@/lib/offline-db'

const formDataToObject = (formData: FormData) => {
  const obj: any = {}
  formData.forEach((value, key) => {
    if (obj[key]) {
      if (Array.isArray(obj[key])) obj[key].push(value)
      else obj[key] = [obj[key], value]
    } else {
      obj[key] = value
    }
  })
  return obj
}

const generateId = () => Math.random().toString(36).substring(2, 15)

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
  preco?: number
  moeda?: string
  categoria?: string
  categoria_outro_descricao?: string
  latitude?: number
  longitude?: number
  expand?: any

  // Aliases for backward compatibility in some components
  date?: string
  time?: string
  type?: string
  description?: string
}

export const getItinerarioByTrip = async (tripId: string): Promise<ItinerarioEvent[]> => {
  let records: ItinerarioEvent[] = []
  if (navigator.onLine) {
    try {
      records = await pb.collection('itinerario').getFullList<ItinerarioEvent>({
        filter: `viagem_id = "${tripId}"`,
        sort: 'data,hora_inicio',
      })
    } catch (e) {
      console.error(e)
    }
  }

  const offlineOps = await getOfflineOps('atividades_offline')
  const offlineCreates = offlineOps.filter(
    (o) => o.action === 'create' && o.payload.viagem_id === tripId,
  )
  const offlineUpdates = offlineOps.filter((o) => o.action === 'update')
  const offlineDeletes = offlineOps.filter((o) => o.action === 'delete')
  const deletesSet = new Set(offlineDeletes.map((o) => o.originalId))

  records = records.filter((r) => !deletesSet.has(r.id))
  records = records.map((r) => {
    const update = offlineUpdates.find((o) => o.originalId === r.id)
    return update ? { ...r, ...update.payload } : r
  })

  offlineCreates.forEach((op) => {
    records.push({
      id: op.localId,
      ...op.payload,
      collectionId: 'itinerario',
      collectionName: 'itinerario',
      created: new Date(op.timestamp).toISOString(),
      updated: new Date(op.timestamp).toISOString(),
    })
  })

  records.sort((a, b) => {
    const timeA = a.data + (a.hora_inicio || '')
    const timeB = b.data + (b.hora_inicio || '')
    return timeA.localeCompare(timeB)
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
  let records: ItinerarioEvent[] = []

  if (navigator.onLine) {
    try {
      const result = await pb.collection('itinerario').getList<ItinerarioEvent>(1, 10, {
        filter: `data >= "${today}"`,
        sort: 'data,hora_inicio',
        expand: 'viagem_id',
      })
      records = result.items
    } catch {
      /* intentionally ignored */
    }
  }

  const offlineOps = await getOfflineOps('atividades_offline')
  const offlineCreates = offlineOps.filter(
    (o) => o.action === 'create' && o.payload.data && o.payload.data >= today,
  )
  const offlineUpdates = offlineOps.filter((o) => o.action === 'update')
  const offlineDeletes = offlineOps.filter((o) => o.action === 'delete')
  const deletesSet = new Set(offlineDeletes.map((o) => o.originalId))

  records = records.filter((r) => !deletesSet.has(r.id))
  records = records.map((r) => {
    const update = offlineUpdates.find((o) => o.originalId === r.id)
    return update ? { ...r, ...update.payload } : r
  })

  offlineCreates.forEach((op) => {
    records.push({
      id: op.localId,
      ...op.payload,
      collectionId: 'itinerario',
      collectionName: 'itinerario',
      created: new Date(op.timestamp).toISOString(),
      updated: new Date(op.timestamp).toISOString(),
    })
  })

  records.sort((a, b) => {
    const timeA = a.data + (a.hora_inicio || '')
    const timeB = b.data + (b.hora_inicio || '')
    return timeA.localeCompare(timeB)
  })

  return {
    items: records.slice(0, 10).map((r) => ({
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
  const isFormData = data instanceof FormData
  const payload = isFormData ? formDataToObject(data) : data

  if (!navigator.onLine) {
    const localId = generateId()
    await saveOfflineOp('atividades_offline', {
      localId,
      action: 'create',
      payload,
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return {
      id: localId,
      ...payload,
      collectionId: 'itinerario',
      collectionName: 'itinerario',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as ItinerarioEvent
  }

  return await pb.collection('itinerario').create<ItinerarioEvent>(data)
}

export const updateItinerario = async (
  id: string,
  data: Partial<ItinerarioEvent> | FormData,
): Promise<ItinerarioEvent> => {
  const isFormData = data instanceof FormData
  const payload = isFormData ? formDataToObject(data) : data

  if (!navigator.onLine) {
    const creates = await getOfflineOps('atividades_offline')
    const existingCreate = creates.find((o) => o.localId === id && o.action === 'create')
    if (existingCreate) {
      await saveOfflineOp('atividades_offline', {
        ...existingCreate,
        payload: { ...existingCreate.payload, ...payload },
        timestamp: Date.now(),
      })
      return { id, ...existingCreate.payload, ...payload } as ItinerarioEvent
    }

    await saveOfflineOp('atividades_offline', {
      localId: generateId(),
      originalId: id,
      action: 'update',
      payload,
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return { id, ...payload } as ItinerarioEvent
  }

  return await pb.collection('itinerario').update<ItinerarioEvent>(id, data)
}

export const deleteItinerario = async (id: string): Promise<void> => {
  if (!navigator.onLine) {
    const creates = await getOfflineOps('atividades_offline')
    const existingCreate = creates.find((o) => o.localId === id && o.action === 'create')
    if (existingCreate) {
      await removeOfflineOp('atividades_offline', id)
      return
    }

    await saveOfflineOp('atividades_offline', {
      localId: generateId(),
      originalId: id,
      action: 'delete',
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return
  }

  await pb.collection('itinerario').delete(id)
}
