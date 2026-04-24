import { useState, useEffect } from 'react'
import { getOfflineOps, removeOfflineOp } from '@/lib/offline-db'
import pb from '@/lib/pocketbase/client'
import { createSyncLog } from '@/services/sincronizacao_offline'
import { useToast } from '@/hooks/use-toast'

export type SyncState = 'online' | 'offline' | 'syncing' | 'synced'

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>(navigator.onLine ? 'online' : 'offline')
  const [pendingCount, setPendingCount] = useState(0)
  const { toast } = useToast()

  const checkPending = async () => {
    const atividades = await getOfflineOps('atividades_offline')
    const despesas = await getOfflineOps('despesas_offline')
    const comentarios = await getOfflineOps('comentarios_offline')
    setPendingCount(atividades.length + despesas.length + comentarios.length)
  }

  useEffect(() => {
    checkPending()
    const interval = setInterval(checkPending, 5000)
    return () => clearInterval(interval)
  }, [])

  const syncStore = async (storeName: string, collection: string, tipo: string) => {
    const ops = await getOfflineOps(storeName)
    for (const op of ops) {
      try {
        if (op.action === 'create') {
          const data = new FormData()
          Object.keys(op.payload).forEach((k) => {
            if (Array.isArray(op.payload[k])) {
              op.payload[k].forEach((v: any) => data.append(k, v))
            } else if (op.payload[k] !== undefined && op.payload[k] !== null) {
              data.append(k, op.payload[k])
            }
          })
          await pb.collection(collection).create(data)
          await createSyncLog({
            usuario_id: op.userId,
            tipo,
            acao: 'criar',
            dados: JSON.stringify(op.payload),
          })
        } else if (op.action === 'update' && op.originalId) {
          try {
            const current = await pb.collection(collection).getOne(op.originalId)
            const currentUpdated = new Date(current.updated).getTime()
            if (currentUpdated > op.timestamp) {
              console.warn('Conflito detectado, a versão do servidor é mais recente.')
            } else {
              const data = new FormData()
              Object.keys(op.payload).forEach((k) => {
                if (Array.isArray(op.payload[k])) {
                  op.payload[k].forEach((v: any) => data.append(k, v))
                } else if (op.payload[k] !== undefined && op.payload[k] !== null) {
                  data.append(k, op.payload[k])
                }
              })
              await pb.collection(collection).update(op.originalId, data)
            }
          } catch (e: any) {
            if (e.status !== 404) throw e
          }
          await createSyncLog({
            usuario_id: op.userId,
            tipo,
            acao: 'editar',
            dados: JSON.stringify(op.payload),
          })
        } else if (op.action === 'delete' && op.originalId) {
          try {
            await pb.collection(collection).delete(op.originalId)
          } catch (e: any) {
            if (e.status !== 404) throw e
          }
          await createSyncLog({
            usuario_id: op.userId,
            tipo,
            acao: 'deletar',
            dados: JSON.stringify({ id: op.originalId }),
          })
        }
        await removeOfflineOp(storeName, op.localId)
      } catch (e) {
        console.error(`Falha ao sincronizar registro local ${op.localId}`, e)
      }
    }
  }

  const syncAll = async () => {
    if (!navigator.onLine) return
    const atividades = await getOfflineOps('atividades_offline')
    const despesas = await getOfflineOps('despesas_offline')
    const comentarios = await getOfflineOps('comentarios_offline')
    const total = atividades.length + despesas.length + comentarios.length

    if (total === 0) {
      setSyncState('online')
      return
    }

    setSyncState('syncing')
    toast({ title: `Sincronizando ${total} de ${total} itens...` })

    await syncStore('atividades_offline', 'itinerario', 'atividade')
    await syncStore('despesas_offline', 'despesas', 'despesa')
    await syncStore('comentarios_offline', 'comentarios', 'comentario')

    await checkPending()
    const remaining =
      (await getOfflineOps('atividades_offline')).length +
      (await getOfflineOps('despesas_offline')).length +
      (await getOfflineOps('comentarios_offline')).length

    if (remaining === 0) {
      setSyncState('synced')
      toast({ title: 'Tudo sincronizado!' })
      setTimeout(() => setSyncState('online'), 3000)
    } else {
      setSyncState('online')
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setSyncState('online')
      syncAll()
    }
    const handleOffline = () => {
      setSyncState('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator.onLine) {
      syncAll()
    }

    const interval = setInterval(() => {
      if (navigator.onLine && pendingCount > 0 && syncState !== 'syncing') {
        syncAll()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [pendingCount, syncState])

  return { syncState, pendingCount, syncAll }
}
