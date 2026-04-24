import { useState, useEffect } from 'react'
import { getOfflineOps, removeOfflineOp, saveOfflineOp } from '@/lib/offline-db'
import pb from '@/lib/pocketbase/client'
import { createSyncLog, markAsSynced } from '@/services/sincronizacao_offline'
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
          const log = await createSyncLog({
            usuario_id: op.userId,
            tipo,
            acao: 'criar',
            dados: JSON.stringify(op.payload),
          })
          await markAsSynced(log.id)
        } else if (op.action === 'update' && op.originalId) {
          try {
            const current = await pb.collection(collection).getOne(op.originalId)
            const currentUpdated = new Date(current.updated).getTime()
            if (currentUpdated > op.timestamp) {
              console.warn('Conflito detectado, a versão do servidor é mais recente.')
              await pb.collection('conflitos_offline').create({
                usuario_id: op.userId,
                tipo: tipo,
                dados_originais: current,
                dados_conflitantes: op.payload,
                data_conflito: new Date().toISOString(),
                resolvido: false,
              })
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
          const log = await createSyncLog({
            usuario_id: op.userId,
            tipo,
            acao: 'editar',
            dados: JSON.stringify(op.payload),
          })
          await markAsSynced(log.id)
        } else if (op.action === 'delete' && op.originalId) {
          try {
            await pb.collection(collection).delete(op.originalId)
          } catch (e: any) {
            if (e.status !== 404) throw e
          }
          const log = await createSyncLog({
            usuario_id: op.userId,
            tipo,
            acao: 'deletar',
            dados: JSON.stringify({ id: op.originalId }),
          })
          await markAsSynced(log.id)
        }
        await removeOfflineOp(storeName, op.localId)
      } catch (e) {
        console.error(`Falha ao sincronizar registro local ${op.localId}`, e)
        op.retryCount = (op.retryCount || 0) + 1
        if (op.retryCount >= 3) {
          await removeOfflineOp(storeName, op.localId)
        } else {
          await saveOfflineOp(storeName, op)
        }
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
      window.dispatchEvent(new Event('sync-completed'))
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
      toast({
        title: 'Você está offline',
        description: 'As alterações serão salvas localmente.',
        variant: 'destructive',
      })
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
