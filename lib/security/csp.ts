/**
 * Content-Security-Policy helpers for the nonce-based rollout (audit M7 / #17).
 *
 * next.config.js keeps a baseline enforced policy (with
 * 'unsafe-inline'/'unsafe-eval') on every response. This module builds the
 * stricter nonce policy (no unsafe-inline / no unsafe-eval in script-src) that
 * the root proxy attaches as a second CSP header on document responses:
 * enforced in production (browsers apply the intersection of both policies,
 * so the nonce requirement wins for scripts), report-only in development
 * (React Refresh needs eval) or when CSP_NONCE_REPORT_ONLY=true is set as the
 * production rollback switch.
 */

/** Edge-runtime-safe random nonce (Web Crypto; no node:crypto in middleware). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * The nonce script policy. style-src keeps 'unsafe-inline' deliberately —
 * inline styles (Leaflet, styled output) are pervasive and a far weaker XSS
 * vector than scripts; that tradeoff is documented rather than silently
 * dropped.
 */
export function buildNonceCsp(nonce: string, options: { isProd: boolean }): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // No 'unsafe-inline' / 'unsafe-eval' here — that is the whole point of the
    // report-only preview. 'strict-dynamic' lets a nonced script load its own
    // chunks without each needing an explicit allowlist entry.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
    "manifest-src 'self'",
    ...(options.isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
