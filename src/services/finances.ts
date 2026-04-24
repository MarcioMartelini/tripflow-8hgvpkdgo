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

export interface OrcamentoPlanejado {
  id: string
  viagem_id: string
  categoria: string
  valor_planejado: number
  moeda: string
}

export interface Despesa {
  id: string
  viagem_id: string
  usuario_id: string
  categoria: string
  descricao?: string
  valor: number
  moeda: string
  data_despesa?: string
  arquivos?: string[]
}

export const getOrcamentos = async (tripId: string): Promise<OrcamentoPlanejado[]> => {
  return await pb.collection('orcamento_planejado').getFullList<OrcamentoPlanejado>({
    filter: `viagem_id = "${tripId}"`,
  })
}

export const getAllDespesas = async (): Promise<Despesa[]> => {
  const user = pb.authStore.record
  if (!user) return []

  let records: Despesa[] = []
  if (navigator.onLine) {
    try {
      records = await pb.collection('despesas').getFullList<Despesa>({
        filter: `usuario_id = "${user.id}"`,
      })
    } catch {
      /* intentionally ignored */
    }
  }

  const offlineOps = await getOfflineOps('despesas_offline')
  const offlineCreates = offlineOps.filter((o) => o.action === 'create' && o.userId === user.id)
  const offlineUpdates = offlineOps.filter((o) => o.action === 'update' && o.userId === user.id)
  const offlineDeletes = offlineOps.filter((o) => o.action === 'delete' && o.userId === user.id)
  const deletesSet = new Set(offlineDeletes.map((o) => o.originalId))

  records = records.filter((r) => !deletesSet.has(r.id))
  records = records.map((r) => {
    const update = offlineUpdates.find((o) => o.originalId === r.id)
    return update ? { ...r, ...update.payload } : r
  })

  offlineCreates.forEach((op) => {
    records.push({ id: op.localId, ...op.payload } as Despesa)
  })

  return records
}

export const getAllOrcamentos = async (): Promise<OrcamentoPlanejado[]> => {
  if (navigator.onLine) {
    try {
      return await pb.collection('orcamento_planejado').getFullList<OrcamentoPlanejado>()
    } catch {
      return []
    }
  }
  return []
}

export const getDespesas = async (tripId: string): Promise<Despesa[]> => {
  let records: Despesa[] = []
  if (navigator.onLine) {
    try {
      records = await pb.collection('despesas').getFullList<Despesa>({
        filter: `viagem_id = "${tripId}"`,
        sort: '-data_despesa',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  const offlineOps = await getOfflineOps('despesas_offline')
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
    records.push({ id: op.localId, ...op.payload })
  })

  records.sort((a, b) => {
    const dateA = a.data_despesa || ''
    const dateB = b.data_despesa || ''
    return dateB.localeCompare(dateA) // descending
  })

  return records
}

export const createOrcamento = async (
  data: Partial<OrcamentoPlanejado>,
): Promise<OrcamentoPlanejado> => {
  return await pb.collection('orcamento_planejado').create<OrcamentoPlanejado>(data)
}

export const updateOrcamento = async (
  id: string,
  data: Partial<OrcamentoPlanejado>,
): Promise<OrcamentoPlanejado> => {
  return await pb.collection('orcamento_planejado').update<OrcamentoPlanejado>(id, data)
}

export const deleteOrcamento = async (id: string): Promise<void> => {
  await pb.collection('orcamento_planejado').delete(id)
}

export const createDespesa = async (data: Partial<Despesa> | FormData): Promise<Despesa> => {
  if (data instanceof FormData) {
    if (!data.has('usuario_id') && pb.authStore.record) {
      data.append('usuario_id', pb.authStore.record.id)
    }
  } else {
    if (!data.usuario_id && pb.authStore.record) {
      data.usuario_id = pb.authStore.record.id
    }
  }

  const isFormData = data instanceof FormData
  const payload = isFormData ? formDataToObject(data) : data

  if (!navigator.onLine) {
    const localId = generateId()
    await saveOfflineOp('despesas_offline', {
      localId,
      action: 'create',
      payload,
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return { id: localId, ...payload } as Despesa
  }

  return await pb.collection('despesas').create<Despesa>(data)
}

export const updateDespesa = async (
  id: string,
  data: Partial<Despesa> | FormData,
): Promise<Despesa> => {
  const isFormData = data instanceof FormData
  const payload = isFormData ? formDataToObject(data) : data

  if (!navigator.onLine) {
    const creates = await getOfflineOps('despesas_offline')
    const existingCreate = creates.find((o) => o.localId === id && o.action === 'create')
    if (existingCreate) {
      await saveOfflineOp('despesas_offline', {
        ...existingCreate,
        payload: { ...existingCreate.payload, ...payload },
        timestamp: Date.now(),
      })
      return { id, ...existingCreate.payload, ...payload } as Despesa
    }

    await saveOfflineOp('despesas_offline', {
      localId: generateId(),
      originalId: id,
      action: 'update',
      payload,
      timestamp: Date.now(),
      status: 'pending',
      userId: pb.authStore.record?.id || '',
    })
    return { id, ...payload } as Despesa
  }

  return await pb.collection('despesas').update<Despesa>(id, data)
}

export const deleteDespesa = async (id: string): Promise<void> => {
  if (!navigator.onLine) {
    const creates = await getOfflineOps('despesas_offline')
    const existingCreate = creates.find((o) => o.localId === id && o.action === 'create')
    if (existingCreate) {
      await removeOfflineOp('despesas_offline', id)
      return
    }

    await saveOfflineOp('despesas_offline', {
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
  await pb.collection('despesas').delete(id)
}
