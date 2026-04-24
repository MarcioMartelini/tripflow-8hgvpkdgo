import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'
import { deriveKey, generateSalt } from '@/lib/crypto'
import pb from '@/lib/pocketbase/client'

interface EncryptionContextType {
  encryptionKey: CryptoKey | null
  initializeKey: (password: string) => Promise<void>
  rekey: (newPassword: string) => Promise<void>
  clearKey: () => void
  hasKey: boolean
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined)

export const useEncryption = () => {
  const context = useContext(EncryptionContext)
  if (!context) throw new Error('useEncryption must be used within an EncryptionProvider')
  return context
}

export const EncryptionProvider = ({ children }: { children: ReactNode }) => {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (!token || !model) {
        setEncryptionKey(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const initializeKey = useCallback(async (password: string) => {
    try {
      const userId = pb.authStore.record?.id
      if (!userId) throw new Error('User not authenticated')

      let saltStr = ''
      let createSalt = false

      try {
        const saltRecord = await pb
          .collection('chaves_usuario')
          .getFirstListItem(`usuario_id="${userId}"`)
        saltStr = saltRecord.salt
      } catch (err) {
        createSalt = true
      }

      if (createSalt || !saltStr) {
        saltStr = generateSalt()
        await pb.collection('chaves_usuario').create({
          usuario_id: userId,
          salt: saltStr,
        })
      }

      const key = await deriveKey(password, saltStr)
      setEncryptionKey(key)
    } catch (error) {
      console.error('Failed to initialize encryption key:', error)
      throw error
    }
  }, [])

  const rekey = useCallback(async (newPassword: string) => {
    try {
      const userId = pb.authStore.record?.id
      if (!userId) throw new Error('User not authenticated')

      const saltStr = generateSalt()

      try {
        const saltRecord = await pb
          .collection('chaves_usuario')
          .getFirstListItem(`usuario_id="${userId}"`)
        await pb.collection('chaves_usuario').update(saltRecord.id, { salt: saltStr })
      } catch (err) {
        await pb.collection('chaves_usuario').create({
          usuario_id: userId,
          salt: saltStr,
        })
      }

      const key = await deriveKey(newPassword, saltStr)
      setEncryptionKey(key)
    } catch (error) {
      console.error('Failed to rekey:', error)
      throw error
    }
  }, [])

  const clearKey = useCallback(() => {
    setEncryptionKey(null)
  }, [])

  return (
    <EncryptionContext.Provider
      value={{ encryptionKey, initializeKey, rekey, clearKey, hasKey: !!encryptionKey }}
    >
      {children}
    </EncryptionContext.Provider>
  )
}
