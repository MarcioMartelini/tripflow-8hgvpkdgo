import pb from '@/lib/pocketbase/client'
import { Documento } from './documentos'

export interface CompartilhamentoDocumento {
  id: string
  documento_id: string
  usuario_compartilhador: string
  usuario_receptor: string
  consentimento_dado: boolean
  created: string
  expand?: {
    documento_id?: Documento
    usuario_compartilhador?: { name: string; avatar?: string }
    usuario_receptor?: { name: string; avatar?: string }
  }
}

export const getSharedWithMe = async (): Promise<CompartilhamentoDocumento[]> => {
  const user = pb.authStore.record
  if (!user) return []
  return await pb.collection('compartilhamento_documentos').getFullList<CompartilhamentoDocumento>({
    filter: `usuario_receptor = "${user.id}"`,
    expand: 'documento_id,usuario_compartilhador',
    sort: '-created',
  })
}

export const getMyShares = async (): Promise<CompartilhamentoDocumento[]> => {
  const user = pb.authStore.record
  if (!user) return []
  return await pb.collection('compartilhamento_documentos').getFullList<CompartilhamentoDocumento>({
    filter: `usuario_compartilhador = "${user.id}"`,
    expand: 'documento_id,usuario_receptor',
    sort: '-created',
  })
}

export const getSharesByDocument = async (
  documentId: string,
): Promise<CompartilhamentoDocumento[]> => {
  return await pb.collection('compartilhamento_documentos').getFullList<CompartilhamentoDocumento>({
    filter: `documento_id = "${documentId}"`,
    expand: 'usuario_receptor',
    sort: '-created',
  })
}

export const shareDocument = async (
  documentId: string,
  receptorId: string,
  consent: boolean,
): Promise<CompartilhamentoDocumento> => {
  const user = pb.authStore.record
  if (!user) throw new Error('User not authenticated')
  return await pb.collection('compartilhamento_documentos').create<CompartilhamentoDocumento>({
    documento_id: documentId,
    usuario_compartilhador: user.id,
    usuario_receptor: receptorId,
    consentimento_dado: consent,
  })
}

export const revokeShare = async (id: string): Promise<void> => {
  await pb.collection('compartilhamento_documentos').delete(id)
}
