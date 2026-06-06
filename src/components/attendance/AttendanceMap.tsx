"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
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
  officeLatitude: number;
  officeLongitude: number;
  radiusMeters: number;
  userLatitude?: number | null;
  userLongitude?: number | null;
  height?: number;
  onRecenter?: () => void;
};

export function AttendanceMap({
  officeLatitude,
  officeLongitude,
  radiusMeters,
  userLatitude,
  userLongitude,
  height = 260,
  onRecenter,
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

  const { tiles, offsetX, offsetY, radiusPx, userOffset } = useMemo(() => {
    if (!Number.isFinite(officeLatitude) || !Number.isFinite(officeLongitude)) {
      return { tiles: [], offsetX: 0, offsetY: 0, radiusPx: 0, userOffset: null };
    }

    const tileX = lonToTileX(officeLongitude, ZOOM);
    const tileY = latToTileY(officeLatitude, ZOOM);
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

    const currentRadiusPx = metresToPixels(officeLatitude, radiusMeters, ZOOM);

    let calculatedUserOffset: { x: number; y: number } | null = null;
    if (Number.isFinite(userLatitude) && Number.isFinite(userLongitude)) {
      const userTileX = lonToTileX(userLongitude!, ZOOM);
      const userTileY = latToTileY(userLatitude!, ZOOM);
      const dx = userTileX - tileX;
      const dy = userTileY - tileY;
      calculatedUserOffset = {
        x: dx * TILE_SIZE,
        y: dy * TILE_SIZE,
      };
    }

    return {
      tiles: grid,
      offsetX: TILE_SIZE * (1 + fractionalX),
      offsetY: TILE_SIZE * (1 + fractionalY),
      radiusPx: currentRadiusPx,
      userOffset: calculatedUserOffset,
    };
  }, [officeLatitude, officeLongitude, radiusMeters, userLatitude, userLongitude]);

  if (!Number.isFinite(officeLatitude) || !Number.isFinite(officeLongitude)) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        borderRadius: "24px",
        overflow: "hidden",
        background: "var(--attn-map-surface)",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(3, ${TILE_SIZE}px)`,
              gridTemplateRows: `repeat(3, ${TILE_SIZE}px)`,
              width: `${PREVIEW_WIDTH}px`,
              height: `${PREVIEW_HEIGHT}px`,
            }}
          >
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
                style={{
                  display: "block",
                  width: `${TILE_SIZE}px`,
                  height: `${TILE_SIZE}px`,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {visible && !hasError && (
        <>
          {/* Geofence Shaded Area circle */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${2 * radiusPx}px`,
              height: `${2 * radiusPx}px`,
              borderRadius: "50%",
              border: "3px dashed rgba(34,197,94,0.65)",
              backgroundColor: "rgba(34,197,94,0.08)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />

          {/* Office Marker pin */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div className="rounded-full bg-white p-1 shadow-md border border-[var(--danger)]">
              <MapPin size={22} className="text-[var(--danger)] fill-[var(--danger)]/10" />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 800, background: "rgba(229,57,53,0.85)", color: "white", padding: "1px 6px", borderRadius: "999px", marginTop: "2px", whiteSpace: "nowrap" }}>Kantor</span>
          </div>

          {/* User Marker pin */}
          {userOffset && (
            <div
              style={{
                position: "absolute",
                left: `calc(50% + ${userOffset.x}px)`,
                top: `calc(50% + ${userOffset.y}px)`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-white shadow-md border-2 border-blue-500 animate-pulse">
                <div className="size-3.5 rounded-full bg-blue-500" />
              </div>
              <span style={{ fontSize: "12px", fontWeight: 800, background: "rgba(59,130,246,0.85)", color: "white", padding: "1px 6px", borderRadius: "999px", marginTop: "4px", whiteSpace: "nowrap" }}>Anda</span>
            </div>
          )}
        </>
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
            gap: "8px",
            color: "var(--text-muted)",
          }}
        >
          <MapPin size={24} className="text-[var(--text-muted)]" />
          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            {hasError
              ? "Peta tidak dapat dimuat. Tampilkan koordinat saja."
              : "Menyiapkan peta lokasi…"}
          </span>
        </div>
      )}

      {onRecenter && (
        <button
          type="button"
          onClick={onRecenter}
          aria-label="Pusatkan ke lokasi Anda"
          className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--text-primary)] shadow-md transition active:scale-95 hover:bg-[var(--bg-secondary)]"
        >
          <LocateFixed size={18} />
        </button>
      )}

      <span
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          fontSize: "12px",
          background: "rgba(255,255,255,0.85)",
          padding: "2px 6px",
          borderRadius: "999px",
          color: "var(--text-muted)",
          fontWeight: 600,
        }}
      >
        © OpenStreetMap contributors
      </span>
    </div>
  );
}
