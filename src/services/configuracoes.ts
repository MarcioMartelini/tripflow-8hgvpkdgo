import pb from '@/lib/pocketbase/client'

export interface Configuracao {
  id: string
  chave: string
  valor: string
  descricao: string
  created: string
  updated: string
}

export const getConfiguracoes = async (): Promise<Configuracao[]> => {
  return pb.collection('configuracoes_sistema').getFullList({
    sort: 'chave',
  })
}

export const updateConfiguracao = async (id: string, valor: string): Promise<Configuracao> => {
  return pb.collection('configuracoes_sistema').update(id, { valor })
}

export const getDatabaseStats = async () => {
  const [trips, itinerario, users] = await Promise.all([
    pb.collection('trips').getList(1, 1),
    pb.collection('itinerario').getList(1, 1),
    pb.collection('users').getList(1, 1),
  ])

  return {
    tripsCount: trips.totalItems,
    itinerarioCount: itinerario.totalItems,
    usersCount: users.totalItems,
  }
}
