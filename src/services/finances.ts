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
