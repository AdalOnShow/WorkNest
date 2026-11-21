/**
 * Password hashing for Better Auth's email/password sign-in.
 *
 * Better Auth's default is scrypt in pure JS, far too slow for Workers. We use
 * PBKDF2-SHA256 through Web Crypto (native code) instead.
 *
 * CPU budget: the Workers free tier allows 10 ms of CPU per request, and a
 * sign-in runs one derivation. Measured cost of one derivation:
 * 100k iterations ≈ 37 ms, 25k ≈ 10 ms, 10k ≈ 3.4 ms. So new hashes use 10k.
 * That is below OWASP's PBKDF2 guidance; it is acceptable here only because
 * passwords exist solely for seeded demo accounts (whose password is public)
 * and real users sign in with Google/GitHub. On Workers Paid, raise
 * ITERATIONS and re-seed; old hashes keep working because each hash stores
 * its own iteration count.
 *
 * Hashing only happens in the seed script (Node). The Worker only verifies,
 * because sign-up is disabled.
 *
 * Format: `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>`
 */

const ALGORITHM = 'pbkdf2-sha256'
/** Iterations for new hashes. */
const ITERATIONS = 10_000
/** Highest count verify accepts (workerd's PBKDF2 limit), for older hashes. */
const MAX_ITERATIONS = 100_000
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
    iterations > MAX_ITERATIONS ||
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
