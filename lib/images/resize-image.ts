import sharp from 'sharp';

/**
 * Server-side, on-the-fly image thumbnailing for the auth-gated image routes
 * (selfie + avatar). Resizing happens AFTER the route's auth/authz/audit
 * checks — it only transforms the response bytes, never the access logic.
 *
 * The selfie/avatar routes are `no-store` (private), so each view re-resizes.
 * Snapping the requested width to a small allowlist caps how many distinct
 * resize operations the server will ever do and blocks resize-bomb abuse via
 * arbitrary/huge `?w` values.
 */
const ALLOWED_WIDTHS = [48, 64, 96, 128, 256, 400, 720] as const;
const MIN_WIDTH = ALLOWED_WIDTHS[0];
const MAX_WIDTH = ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];

/**
 * Parse + sanitize the `w` query param into an allowed thumbnail width.
 * Returns null when absent or invalid (caller then serves the original file).
 */
export function parseImageWidth(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get('w');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  const clamped = Math.min(Math.max(Math.round(n), MIN_WIDTH), MAX_WIDTH);
  // Snap up to the nearest allowed width.
  return ALLOWED_WIDTHS.find((w) => w >= clamped) ?? MAX_WIDTH;
}

/**
 * Resize an image buffer to a max width (preserving aspect ratio, never
 * upscaling) and re-encode as WebP. `.rotate()` applies EXIF orientation so
 * phone selfies aren't sideways.
 */
export async function resizeImageToWebp(buffer: Buffer, width: number): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(width, width, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();
}
