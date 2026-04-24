import pb from '@/lib/pocketbase/client'

export interface LogAuditoria {
  id: string
  usuario_id: string
  acao: string
  email: string
  created: string
  updated: string
}

export const getAuditLogs = async (): Promise<LogAuditoria[]> => {
  const user = pb.authStore.record
  if (!user) return []
  return await pb.collection('logs_auditoria').getFullList<LogAuditoria>({
    filter: `usuario_id = "${user.id}"`,
    sort: '-created',
  })
}
