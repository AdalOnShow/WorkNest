import { createMiddleware, createStart } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

/**
 * Baseline security headers on every response.
 *
 * The CSP only covers framing, base URI, plugins and form targets. A
 * script-src policy would need per-request nonces for SSR's inline scripts.
 */
const securityHeaders = createMiddleware().server(({ next, request }) => {
  // A WebSocket handshake's 101 response comes from the Durable Object.
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    setResponseHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
    setResponseHeader('X-Content-Type-Options', 'nosniff')
    setResponseHeader('X-Frame-Options', 'DENY')
    setResponseHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    setResponseHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    )
    setResponseHeader(
      'Content-Security-Policy',
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://accounts.google.com https://github.com",
    )
  }
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders],
}))
