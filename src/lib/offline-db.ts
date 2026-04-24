export interface OfflineOperation {
  localId: string
  originalId?: string
  action: 'create' | 'update' | 'delete'
  payload: any
  timestamp: number
  status: 'pending' | 'syncing' | 'error'
  userId: string
}

const DB_NAME = 'TripFlowOfflineDB'
const DB_VERSION = 1

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('atividades_offline')) {
        db.createObjectStore('atividades_offline', { keyPath: 'localId' })
      }
      if (!db.objectStoreNames.contains('despesas_offline')) {
        db.createObjectStore('despesas_offline', { keyPath: 'localId' })
      }
      if (!db.objectStoreNames.contains('comentarios_offline')) {
        db.createObjectStore('comentarios_offline', { keyPath: 'localId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const saveOfflineOp = async (storeName: string, op: OfflineOperation) => {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.put(op)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const getOfflineOps = async (storeName: string): Promise<OfflineOperation[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const removeOfflineOp = async (storeName: string, localId: string) => {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.delete(localId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
