"use client";

/**
 * Tiny zero-dependency OpenStreetMap preview for work-location cards.
 *
 * Renders a 3×3 grid of OSM raster tiles centred on the given lat/lon, with
 * an SVG overlay showing the geo-fence radius. Lazy-loads the tiles only
 * when the component is in the viewport so the locations page stays cheap
 * on slow connections.
 *
 * No JS dependency. ≈ 0 B JS impact at the bundle level. Tiles ride the
 * client cache. The component degrades to a coordinate-only block if the
 * browser blocks the tile host or if `IntersectionObserver` is unavailable.
 *
 * Tile usage policy: OpenStreetMap tile.openstreetmap.org — fair-use only.
 * If load grows past the OSM policy, swap the `TILE_URL` to a self-hosted
 * tile server or to a paid provider via env without changing the layout.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  TILE_SIZE,
  buildTileUrl,
  getDefaultTileTemplate,
  latToTileY,
  lonToTileX,
  metresToPixels,
} from "@/lib/maps/osm-tile-math";

const TILE_TEMPLATE = getDefaultTileTemplate();
const PREVIEW_WIDTH = 3 * TILE_SIZE;
const PREVIEW_HEIGHT = 3 * TILE_SIZE;
const ZOOM = 17;

type Props = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  label?: string;
  /** Render width/height in CSS pixels. Aspect ratio is preserved. */
  height?: number;
};

export function WorkLocationMap({
  latitude,
  longitude,
  radiusMeters,
  label,
  height = 160,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { tiles, offsetX, offsetY, radiusPx } = useMemo(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { tiles: [], offsetX: 0, offsetY: 0, radiusPx: 0 };
    }

    const tileX = lonToTileX(longitude, ZOOM);
    const tileY = latToTileY(latitude, ZOOM);
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const fractionalX = tileX - centerTileX;
    const fractionalY = tileY - centerTileY;

    const grid: { x: number; y: number; url: string; key: string }[] = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = centerTileX + dx;
        const y = centerTileY + dy;
        grid.push({ x, y, url: buildTileUrl(TILE_TEMPLATE, ZOOM, x, y), key: `${x}-${y}` });
      }
    }

    return {
      tiles: grid,
      offsetX: TILE_SIZE * (1 + fractionalX),
      offsetY: TILE_SIZE * (1 + fractionalY),
      radiusPx: metresToPixels(latitude, radiusMeters, ZOOM),
    };
  }, [latitude, longitude, radiusMeters]);

  const accessibleLabel = label
    ? `Peta ${label} pada ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    : `Peta lokasi kerja pada ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      role="img"
      aria-label={accessibleLabel}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--bg-input)",
        border: "1px solid var(--border-color)",
      }}
    >
      {visible && !hasError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(calc(50% - ${offsetX}px), calc(50% - ${offsetY}px))`,
            transformOrigin: "0 0",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: `repeat(3, ${TILE_SIZE}px)`, gridTemplateRows: `repeat(3, ${TILE_SIZE}px)`, width: `${PREVIEW_WIDTH}px`, height: `${PREVIEW_HEIGHT}px` }}>
            {tiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                width={TILE_SIZE}
                height={TILE_SIZE}
                loading="lazy"
                decoding="async"
                onError={() => setHasError(true)}
                style={{ display: "block", width: `${TILE_SIZE}px`, height: `${TILE_SIZE}px`, pointerEvents: "none", userSelect: "none" }}
              />
            ))}
          </div>
        </div>
      )}

      {visible && !hasError && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <circle cx="50" cy="50" r={Math.min(48, (radiusPx / TILE_SIZE) * 100 / 6)} fill="rgba(253,199,4,0.18)" stroke="rgba(253,199,4,0.65)" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="1.5" fill="var(--accent-red)" />
        </svg>
      )}

      {(!visible || hasError) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "6px",
            color: "var(--text-muted)",
          }}
        >
          <MapPin size={20} aria-hidden="true" />
          <span style={{ fontSize: "11px" }}>
            {hasError
              ? "Peta tidak dapat dimuat. Tampilkan koordinat saja."
              : "Peta dimuat saat terlihat..."}
          </span>
        </div>
      )}

      <span
        style={{
          position: "absolute",
          right: 4,
          bottom: 4,
          fontSize: "9px",
          background: "rgba(255,255,255,0.85)",
          padding: "1px 4px",
          borderRadius: "3px",
          color: "var(--text-muted)",
        }}
      >
        © OpenStreetMap
      </span>
    </div>
  );
}
