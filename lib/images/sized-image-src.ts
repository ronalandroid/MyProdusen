/**
 * Client-safe helper (no sharp import) that appends a `?w=` thumbnail hint to
 * image URLs served by our resize-capable, auth-gated routes. It's a no-op for
 * anything else — `data:`/`blob:` previews, external URLs, empty/null — so it's
 * always safe to wrap any image `src`.
 */
const RESIZABLE_PREFIXES = ['/api/attendance/selfie/', '/api/profile/avatar/'];

export function sizedImageSrc(
  src: string | null | undefined,
  width: number,
): string | undefined {
  if (!src) return src ?? undefined;
  if (!RESIZABLE_PREFIXES.some((prefix) => src.startsWith(prefix))) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}w=${width}`;
}
