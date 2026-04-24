export const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export const base64ToArrayBuffer = (base64: string): Uint8Array => {
  const binary_string = window.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes
}

export const generateSalt = (): string => {
  const salt = window.crypto.getRandomValues(new Uint8Array(32))
  return arrayBufferToBase64(salt)
}

export const deriveKey = async (password: string, saltBase64: string): Promise<CryptoKey> => {
  const saltBuffer = base64ToArrayBuffer(saltBase64)
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  )

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export const encryptData = async (
  key: CryptoKey,
  data: string,
): Promise<{ cipherText: string; iv: string }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(data),
  )
  return {
    cipherText: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv),
  }
}

export const decryptData = async (
  key: CryptoKey,
  cipherTextBase64: string,
  ivBase64: string,
): Promise<string> => {
  const cipherBuffer = base64ToArrayBuffer(cipherTextBase64)
  const iv = base64ToArrayBuffer(ivBase64)
  const decBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    cipherBuffer,
  )
  const dec = new TextDecoder()
  return dec.decode(decBuffer)
}
