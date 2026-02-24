/**
 * Encryption utilities for sensitive data (database credentials)
 * Uses AES-256-GCM encryption
 */

import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt sensitive data (e.g., database passwords)
 */
export function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }
  
  const [ivHex, authTagHex, encrypted] = parts
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Encrypt database connection (especially password)
 */
export function encryptDatabaseConnection(connection: any): any {
  if (!connection || connection.type === 'firestore') {
    return connection
  }
  
  const encrypted = { ...connection }
  
  // Encrypt password if present
  if (encrypted.password) {
    encrypted.password = encrypt(encrypted.password)
  }
  
  // Encrypt connection string if it contains credentials
  if (encrypted.connectionString && encrypted.connectionString.includes('://')) {
    try {
      const url = new URL(encrypted.connectionString)
      if (url.password) {
        // Extract password, encrypt, rebuild
        const password = url.password
        const encryptedPassword = encrypt(password)
        encrypted.connectionString = encrypted.connectionString.replace(
          `:${password}@`,
          `:${encryptedPassword}@`
        )
      }
    } catch (e) {
      // If URL parsing fails, encrypt the whole string
      encrypted.connectionString = encrypt(encrypted.connectionString)
    }
  }
  
  return encrypted
}

/**
 * Decrypt database connection
 */
export function decryptDatabaseConnection(connection: any): any {
  if (!connection || connection.type === 'firestore') {
    return connection
  }
  
  const decrypted = { ...connection }
  
  // Decrypt password if present
  if (decrypted.password && decrypted.password.includes(':')) {
    try {
      decrypted.password = decrypt(decrypted.password)
    } catch (e) {
      console.error('Failed to decrypt password:', e)
      // If decryption fails, password might not be encrypted (old format)
    }
  }
  
  // Decrypt connection string if needed
  if (decrypted.connectionString && decrypted.connectionString.includes(':')) {
    try {
      // Check if it's an encrypted connection string (has : separators from encryption)
      const parts = decrypted.connectionString.split(':')
      if (parts.length === 3 && !decrypted.connectionString.includes('://')) {
        decrypted.connectionString = decrypt(decrypted.connectionString)
      } else if (decrypted.connectionString.includes('://')) {
        // Try to decrypt password in connection string
        try {
          const url = new URL(decrypted.connectionString)
          if (url.password && url.password.includes(':')) {
            const decryptedPassword = decrypt(url.password)
            decrypted.connectionString = decrypted.connectionString.replace(
              `:${url.password}@`,
              `:${decryptedPassword}@`
            )
          }
        } catch (e) {
          // URL parsing failed, might be encrypted
          try {
            decrypted.connectionString = decrypt(decrypted.connectionString)
          } catch (e2) {
            // Not encrypted, use as-is
          }
        }
      }
    } catch (e) {
      console.error('Failed to decrypt connection string:', e)
      // If decryption fails, use as-is (might not be encrypted)
    }
  }
  
  return decrypted
}

