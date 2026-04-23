import pb from '@/lib/pocketbase/client'

export interface Documento {
  id: string
  usuario_id: string
  viagem_id: string
  tipo: string
  nome_arquivo: string
  url_arquivo?: string
  arquivo?: string
  data_expiracao?: string
  notas?: string
  created: string
  updated: string
  collectionId: string
  collectionName: string
}

export const getDocumentosCount = async () => {
  const userId = pb.authStore.record?.id
  if (!userId) return 0
  const res = await pb.collection('documentos').getList(1, 1, {
    filter: `usuario_id = "${userId}"`,
    fields: 'id',
  })
  return res.totalItems
}

export const getTripDocuments = async (tripId: string): Promise<Documento[]> => {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('User not authenticated')

  return pb.collection('documentos').getFullList<Documento>({
    filter: `viagem_id = "${tripId}" && usuario_id = "${userId}"`,
    sort: '-created',
  })
}

export const createDocument = async (tripId: string, data: FormData) => {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('User not authenticated')

  data.append('usuario_id', userId)
  data.append('viagem_id', tripId)
  return pb.collection('documentos').create<Documento>(data)
}

export const deleteDocument = async (id: string) => {
  return pb.collection('documentos').delete(id)
}

export const getDocumentUrl = (doc: Documento) => {
  if (doc.id.startsWith('m0ckdoc')) {
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
  if (doc.arquivo) {
    return pb.files.getURL(doc, doc.arquivo)
  }
  return doc.url_arquivo || ''
}
