import pb from '@/lib/pocketbase/client'
import { saveOfflineOp, getOfflineOps, removeOfflineOp } from '@/lib/offline-db'

const generateId = () => Math.random().toString(36).substring(2, 15)

export interface Comentario {
  id: string
  atividade_id: string
  usuario_id: string
  viagem_id: string
  texto: string
  created: string
  updated: string
  expand?: any
}

export const getComentarios = async (atividadeId: string) => {
  let records: Comentario[] = []
  if (navigator.onLine) {
    try {
      records = await pb.collection('comentarios').getFullList<Comentario>({
        filter: `atividade_id = "${atividadeId}"`,
        sort: '-created',
        expand: 'usuario_id',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  const offlineOps = await getOfflineOps('comentarios_offline')
  const offlineCreates = offlineOps.filter(
    (o) => o.action === 'create' && o.payload.atividade_id === atividadeId,
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
      created: new Date(op.timestamp).toISOString(),
      updated: new Date(op.timestamp).toISOString(),
      expand: {
        usuario_id: {
          name: pb.authStore.record?.name || 'Você (Offline)',
          avatar: pb.authStore.record?.avatar || '',
        },
      },
    })
  })

  records.sort((a, b) => {
    const dateA = a.created || ''
    const dateB = b.created || ''
    return dateB.localeCompare(dateA) // descending
  })

  return records
}

export const getComentario = (id: string) =>
  pb.collection('comentarios').getOne<Comentario>(id, {
    expand: 'usuario_id',
  })

export const createComentario = async (data: {
  atividade_id: string
  usuario_id: string
  viagem_id: string
  texto: string
}) => {
  if (!navigator.onLine) {
    const localId = generateId()
    await saveOfflineOp('comentarios_offline', {
      localId,
      action: 'create',
      payload: data,
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return {
      id: localId,
      ...data,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as Comentario
  }
  return await pb.collection('comentarios').create<Comentario>(data)
}

export const updateComentario = async (id: string, data: Partial<{ texto: string }>) => {
  if (!navigator.onLine) {
    const creates = await getOfflineOps('comentarios_offline')
    const existingCreate = creates.find((o) => o.localId === id && o.action === 'create')
    if (existingCreate) {
      await saveOfflineOp('comentarios_offline', {
        ...existingCreate,
        payload: { ...existingCreate.payload, ...data },
        timestamp: Date.now(),
      })
      return { id, ...existingCreate.payload, ...data } as Comentario
    }

    await saveOfflineOp('comentarios_offline', {
      localId: generateId(),
      originalId: id,
      action: 'update',
      payload: data,
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return { id, ...data } as Comentario
  }
  return await pb.collection('comentarios').update<Comentario>(id, data)
}

export const deleteComentario = async (id: string) => {
  if (!navigator.onLine) {
    const creates = await getOfflineOps('comentarios_offline')
    const existingCreate = creates.find((o) => o.localId === id && o.action === 'create')
    if (existingCreate) {
      await removeOfflineOp('comentarios_offline', id)
      return
    }

    await saveOfflineOp('comentarios_offline', {
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
  return await pb.collection('comentarios').delete(id)
}
