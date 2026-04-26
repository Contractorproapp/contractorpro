// AES-GCM-256 helpers for at-rest encryption of secrets in Supabase tables.
// The encryption key never touches the database — it lives only as the
// `ENCRYPTION_KEY` Edge Function secret (32 bytes base64-encoded).
//
// Usage:
//   const ct = await encryptSecret('sk-ant-...')
//   const pt = await decryptSecret(ct)

const ENCRYPTION_KEY_B64 = Deno.env.get('ENCRYPTION_KEY') ?? ''

let cachedKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  if (!ENCRYPTION_KEY_B64) {
    throw new Error('ENCRYPTION_KEY env var not set on this Edge Function')
  }
  const raw = base64ToBytes(ENCRYPTION_KEY_B64)
  if (raw.byteLength !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits)')
  }
  cachedKey = await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
  return cachedKey
}

/**
 * Encrypt a UTF-8 string. Returns a base64 string of `iv || ciphertext`.
 * Each call generates a fresh random 12-byte IV.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  if (!plaintext) return ''
  const key = await getKey()
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder().encode(plaintext)
  const ct  = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc),
  )
  const combined = new Uint8Array(iv.byteLength + ct.byteLength)
  combined.set(iv, 0)
  combined.set(ct, iv.byteLength)
  return bytesToBase64(combined)
}

/**
 * Decrypt a base64 ciphertext produced by `encryptSecret`. Returns plaintext.
 */
export async function decryptSecret(ciphertextB64: string): Promise<string> {
  if (!ciphertextB64) return ''
  const key = await getKey()
  const combined = base64ToBytes(ciphertextB64)
  if (combined.byteLength < 13) throw new Error('Invalid ciphertext')
  const iv = combined.slice(0, 12)
  const ct = combined.slice(12)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

// ─── base64 helpers (URL-safe edge-runtime friendly) ─────────────
function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
