import pb from '@/lib/pocketbase/client'

export interface Alerta {
  id: string
  usuario_id: string
  viagem_id?: string
  tipo: string
  mensagem: string
  data_alerta?: string
  lido: boolean
  created: string
}

export const getAlertas = async (userId: string): Promise<Alerta[]> => {
  return await pb.collection('alertas').getFullList<Alerta>({
    filter: `usuario_id = "${userId}"`,
    sort: '-created',
  })
}

export const markAlertaAsRead = async (id: string): Promise<Alerta> => {
  return await pb.collection('alertas').update<Alerta>(id, { lido: true })
}

export const deleteAlerta = async (id: string): Promise<void> => {
  await pb.collection('alertas').delete(id)
}
