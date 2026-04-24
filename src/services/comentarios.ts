import pb from '@/lib/pocketbase/client'

export interface Comentario {
  id: string
  atividade_id: string
  usuario_id: string
  viagem_id: string
  texto: string
  created: string
  updated: string
  expand?: any
}

export const getComentarios = (atividadeId: string) =>
  pb.collection('comentarios').getFullList<Comentario>({
    filter: `atividade_id = "${atividadeId}"`,
    sort: '-created',
    expand: 'usuario_id',
  })

export const getComentario = (id: string) =>
  pb.collection('comentarios').getOne<Comentario>(id, {
    expand: 'usuario_id',
  })

export const createComentario = (data: {
  atividade_id: string
  usuario_id: string
  viagem_id: string
  texto: string
}) => pb.collection('comentarios').create<Comentario>(data)

export const updateComentario = (id: string, data: Partial<{ texto: string }>) =>
  pb.collection('comentarios').update<Comentario>(id, data)

export const deleteComentario = (id: string) => pb.collection('comentarios').delete(id)
