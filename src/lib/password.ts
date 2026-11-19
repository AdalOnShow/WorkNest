/**
 * Password hashing for Better Auth's email/password sign-in.
 *
 * Better Auth's default is scrypt in pure JS, which can exceed the Workers
 * free-tier CPU limit (10ms) on every sign-in. PBKDF2 through Web Crypto runs
 * natively in workerd. 100k iterations is the maximum workerd allows.
 *
 * Only Web Crypto is used, so the same module also runs in Node (the seed
 * script imports it to create the demo account).
 *
 * Format: `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>`
 */

const ALGORITHM = 'pbkdf2-sha256'
const ITERATIONS = 100_000
const SALT_BYTES = 16
const KEY_BITS = 256

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, ITERATIONS)
  return `${ALGORITHM}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string
  password: string
}): Promise<boolean> {
  const [algorithm, iterationsRaw, saltB64, hashB64] = hash.split('$')
  const iterations = Number(iterationsRaw)
  if (
    algorithm !== ALGORITHM ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > ITERATIONS ||
    !saltB64 ||
    !hashB64
  ) {
    return false
  }
  const expected = fromBase64(hashB64)
  const actual = await derive(password, fromBase64(saltB64), iterations)
  if (actual.length !== expected.length) return false
  // Constant-time comparison.
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ expected[i]!
  return diff === 0
}
