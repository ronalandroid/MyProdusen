/**
 * Pure helpers for the work-location OpenStreetMap preview. Kept in lib/ so
 * they can be unit-tested without bringing in React.
 *
 * Tile usage policy: see /docs/ui-ux-guide/README.md and /docs/architecture/README.md.
 */

export const TILE_SIZE = 256;

export function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

export function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

/**
 * Web Mercator metres → CSS pixels at the given zoom level. The returned
 * value scales with `cos(latitude)` so polar areas are approximated
 * conservatively. Always treat the result as an upper bound on visible size.
 */
export function metresToPixels(latitude: number, metres: number, zoom: number): number {
  const earthCircumference = 40075016.686;
  const metresPerPixel =
    (earthCircumference * Math.cos((latitude * Math.PI) / 180)) /
    Math.pow(2, zoom + 8);
  return metres / metresPerPixel;
}

const FALLBACK_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function buildTileUrl(template: string | null | undefined, zoom: number, x: number, y: number): string {
  const safe = template?.trim() ? template.trim() : FALLBACK_TILE_URL;
  return safe
    .replace("{z}", String(zoom))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

export function getDefaultTileTemplate(): string {
  const fromEnv = (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_OSM_TILE_URL : undefined) || "";
  return fromEnv.trim() || FALLBACK_TILE_URL;
}
