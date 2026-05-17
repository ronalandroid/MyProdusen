import { describe, expect, it } from 'vitest';
import {
  buildTileUrl,
  getDefaultTileTemplate,
  latToTileY,
  lonToTileX,
  metresToPixels,
} from '@/lib/maps/osm-tile-math';

describe('osm-tile-math', () => {
  it('lonToTileX wraps the equator at zoom 0', () => {
    expect(lonToTileX(-180, 0)).toBeCloseTo(0, 6);
    expect(lonToTileX(180, 0)).toBeCloseTo(1, 6);
    expect(lonToTileX(0, 0)).toBeCloseTo(0.5, 6);
  });

  it('latToTileY puts the equator at the centre', () => {
    expect(latToTileY(0, 0)).toBeCloseTo(0.5, 6);
  });

  it('lonToTileX / latToTileY map Medan to a sane tile at zoom 17', () => {
    const x = lonToTileX(98.6722, 17);
    const y = latToTileY(3.5952, 17);
    // Sumatra at zoom 17 — quick smoke ranges (≈ 100k for x, 64k for y).
    expect(x).toBeGreaterThan(100_000);
    expect(x).toBeLessThan(105_000);
    expect(y).toBeGreaterThan(63_000);
    expect(y).toBeLessThan(68_000);
  });

  it('metresToPixels grows monotonically with metres', () => {
    const small = metresToPixels(3.5952, 50, 17);
    const large = metresToPixels(3.5952, 200, 17);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeCloseTo(small * 4, 5);
  });

  it('metresToPixels respects latitude (Web Mercator inflates the polar regions)', () => {
    // In Web Mercator a metre maps to MORE pixels at high latitudes because
    // the projection stretches near the poles to keep angles preserved.
    const equator = metresToPixels(0, 100, 17);
    const high = metresToPixels(70, 100, 17);
    expect(high).toBeGreaterThan(equator);
  });

  it('buildTileUrl substitutes z/x/y placeholders', () => {
    expect(buildTileUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png', 17, 105100, 65200))
      .toBe('https://tile.openstreetmap.org/17/105100/65200.png');
  });

  it('buildTileUrl falls back to the OSM default when template is empty', () => {
    expect(buildTileUrl('', 17, 1, 2)).toBe('https://tile.openstreetmap.org/17/1/2.png');
    expect(buildTileUrl(undefined, 17, 1, 2)).toBe('https://tile.openstreetmap.org/17/1/2.png');
  });

  it('getDefaultTileTemplate returns the OSM default when env is unset', () => {
    const original = process.env.NEXT_PUBLIC_OSM_TILE_URL;
    delete process.env.NEXT_PUBLIC_OSM_TILE_URL;
    try {
      expect(getDefaultTileTemplate()).toContain('tile.openstreetmap.org');
    } finally {
      if (original !== undefined) process.env.NEXT_PUBLIC_OSM_TILE_URL = original;
    }
  });

  it('getDefaultTileTemplate honours the env override', () => {
    const original = process.env.NEXT_PUBLIC_OSM_TILE_URL;
    process.env.NEXT_PUBLIC_OSM_TILE_URL = 'https://tiles.example.com/{z}/{x}/{y}.png';
    try {
      expect(getDefaultTileTemplate()).toBe('https://tiles.example.com/{z}/{x}/{y}.png');
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_OSM_TILE_URL;
      else process.env.NEXT_PUBLIC_OSM_TILE_URL = original;
    }
  });
});
