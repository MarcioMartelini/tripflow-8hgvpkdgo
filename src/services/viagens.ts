import pb from '@/lib/pocketbase/client'

export const deleteViagem = async (tripId: string): Promise<void> => {
  const collections = [
    { name: 'viajantes', field: 'viagem_id' },
    { name: 'itinerario', field: 'viagem_id' },
    { name: 'documentos', field: 'viagem_id' },
    { name: 'tickets', field: 'viagem_id' },
    { name: 'reservas', field: 'viagem_id' },
    { name: 'orcamento_planejado', field: 'viagem_id' },
    { name: 'despesas', field: 'viagem_id' },
    { name: 'alertas', field: 'viagem_id' },
    { name: 'events', field: 'trip_id' },
  ]

  for (const { name, field } of collections) {
    try {
      const records = await pb.collection(name).getFullList({
        filter: `${field} = "${tripId}"`,
      })
      await Promise.all(records.map((record) => pb.collection(name).delete(record.id)))
    } catch (e) {
      console.error(`Erro ao buscar ou deletar registros relacionados em ${name}:`, e)
    }
  }

  try {
    await pb.collection('trips').delete(tripId)
  } catch (error) {
    console.error('Erro ao deletar a viagem principal:', error)
    throw new Error(
      'Não foi possível deletar a viagem. Verifique sua permissão ou conexão e tente novamente.',
    )
  }
}
