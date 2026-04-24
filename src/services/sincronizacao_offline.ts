import pb from '@/lib/pocketbase/client'

export interface SincronizacaoOffline {
  id: string
  usuario_id: string
  tipo: 'atividade' | 'despesa' | 'comentario' | 'outro'
  acao: 'criar' | 'editar' | 'deletar'
  dados: string
  sincronizado: boolean
  sincronizado_em?: string
  created: string
  updated: string
}

export const getPendingSyncs = (userId: string) =>
  pb.collection('sincronizacao_offline').getFullList<SincronizacaoOffline>({
    filter: `usuario_id = "${userId}" && sincronizado = false`,
    sort: 'created',
  })

export const createSyncLog = (data: {
  usuario_id: string
  tipo: string
  acao: string
  dados: string
}) =>
  pb.collection('sincronizacao_offline').create<SincronizacaoOffline>({
    ...data,
    sincronizado: false,
  })

export const markAsSynced = (id: string) =>
  pb.collection('sincronizacao_offline').update<SincronizacaoOffline>(id, {
    sincronizado: true,
    sincronizado_em: new Date().toISOString(),
  })
