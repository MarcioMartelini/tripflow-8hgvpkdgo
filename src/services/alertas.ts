import pb from '@/lib/pocketbase/client'

export interface Alerta {
  id: string
  usuario_id: string
  viagem_id?: string
  tipo: 'voo' | 'hotel' | 'atividade' | 'documento' | 'outro'
  mensagem: string
  data_alerta?: string
  lido: boolean
  created: string
  updated: string
}

export const getAlertas = async (usuarioId: string): Promise<Alerta[]> => {
  return pb.collection('alertas').getFullList({
    filter: `usuario_id = "${usuarioId}"`,
    sort: '-created',
  })
}

export const markAlertaAsRead = async (id: string) => {
  return pb.collection('alertas').update(id, { lido: true })
}

export const deleteAlerta = async (id: string) => {
  return pb.collection('alertas').delete(id)
}
