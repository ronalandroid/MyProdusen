/**
 * Content-Security-Policy helpers for the nonce-based rollout (audit M7 / #17).
 *
 * The ENFORCED policy still lives in next.config.js and keeps
 * 'unsafe-inline'/'unsafe-eval' so nothing breaks today. This module builds a
 * stricter *report-only* policy (no unsafe-inline / no unsafe-eval in
 * script-src, per-request nonce instead) that the root middleware attaches
 * alongside it. Report-only never blocks — it only surfaces what a future
 * enforced nonce policy would reject, so the team can review violations before
 * flipping enforcement.
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
 * The target script policy, expressed as report-only so it cannot break the
 * app. style-src keeps 'unsafe-inline' deliberately — inline styles (Leaflet,
 * styled output) are pervasive and a far weaker XSS vector than scripts; that
 * tradeoff is documented rather than silently dropped.
 */
export function buildReportOnlyCsp(nonce: string, options: { isProd: boolean }): string {
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
