import pb from '@/lib/pocketbase/client'

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

export const getDespesas = async (tripId: string): Promise<Despesa[]> => {
  return await pb.collection('despesas').getFullList<Despesa>({
    filter: `viagem_id = "${tripId}"`,
    sort: '-data_despesa',
  })
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
  return await pb.collection('despesas').create<Despesa>(data)
}

export const updateDespesa = async (
  id: string,
  data: Partial<Despesa> | FormData,
): Promise<Despesa> => {
  return await pb.collection('despesas').update<Despesa>(id, data)
}

export const deleteDespesa = async (id: string): Promise<void> => {
  await pb.collection('despesas').delete(id)
}
