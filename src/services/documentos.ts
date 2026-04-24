import pb from '@/lib/pocketbase/client'

export interface Documento {
  id: string
  viagem_id: string
  usuario_id: string
  tipo: string
  nome_arquivo: string
  nome_arquivo_original?: string
  iv?: string
  url_arquivo?: string
  data_expiracao?: string
  arquivo: string
  notas?: string
}

export const getTripDocuments = async (tripId: string): Promise<Documento[]> => {
  return await pb.collection('documentos').getFullList<Documento>({
    filter: `viagem_id = "${tripId}"`,
    sort: '-created',
  })
}

export const getAllDocuments = async (): Promise<Documento[]> => {
  const user = pb.authStore.record
  if (!user) return []
  return await pb.collection('documentos').getFullList<Documento>({
    filter: `usuario_id = "${user.id}"`,
    sort: '-created',
  })
}

export const getDocumentosCount = async (): Promise<number> => {
  const user = pb.authStore.record
  if (!user) return 0
  const result = await pb.collection('documentos').getList(1, 1, {
    filter: `usuario_id = "${user.id}"`,
  })
  return result.totalItems
}

export const createDocument = async (tripId: string, formData: FormData): Promise<Documento> => {
  if (!formData.has('viagem_id')) formData.append('viagem_id', tripId)
  if (!formData.has('usuario_id') && pb.authStore.record) {
    formData.append('usuario_id', pb.authStore.record.id)
  }
  return await pb.collection('documentos').create<Documento>(formData)
}

export const updateDocument = async (
  id: string,
  data: FormData | Partial<Documento>,
): Promise<Documento> => {
  return await pb.collection('documentos').update<Documento>(id, data)
}

export const deleteDocument = async (id: string): Promise<void> => {
  await pb.collection('documentos').delete(id)
}

export const getDocumentUrl = (doc: Documento): string => {
  return pb.files.getURL(doc, doc.arquivo)
}
