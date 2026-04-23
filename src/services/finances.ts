import pb from '@/lib/pocketbase/client'

export interface OrcamentoPlanejado {
  id: string
  viagem_id: string
  categoria: string
  valor_planejado: number
  moeda: string
  created: string
  updated: string
}

export interface Despesa {
  id: string
  viagem_id: string
  usuario_id: string
  categoria: string
  descricao: string
  valor: number
  moeda: string
  data_despesa: string
  created: string
  updated: string
}

export const getOrcamentos = (viagemId: string) =>
  pb
    .collection('orcamento_planejado')
    .getFullList<OrcamentoPlanejado>({ filter: `viagem_id = "${viagemId}"` })

export const getDespesas = (viagemId: string) =>
  pb
    .collection('despesas')
    .getFullList<Despesa>({ filter: `viagem_id = "${viagemId}"`, sort: '-data_despesa' })

export const createOrcamento = (data: Partial<OrcamentoPlanejado>) =>
  pb.collection('orcamento_planejado').create<OrcamentoPlanejado>(data)

export const updateOrcamento = (id: string, data: Partial<OrcamentoPlanejado>) =>
  pb.collection('orcamento_planejado').update<OrcamentoPlanejado>(id, data)

export const createDespesa = (data: Partial<Despesa>) =>
  pb.collection('despesas').create<Despesa>(data)

export const deleteDespesa = (id: string) => pb.collection('despesas').delete(id)
