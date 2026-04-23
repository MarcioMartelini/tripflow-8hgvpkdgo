import pb from '@/lib/pocketbase/client'

export const getDocumentosCount = async () => {
  const userId = pb.authStore.record?.id
  if (!userId) return 0
  const res = await pb.collection('documentos').getList(1, 1, {
    filter: `usuario_id = "${userId}"`,
    fields: 'id',
  })
  return res.totalItems
}
