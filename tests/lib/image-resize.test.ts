import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { parseImageWidth, resizeImageToWebp } from '@/lib/images/resize-image';
import { sizedImageSrc } from '@/lib/images/sized-image-src';

const withW = (v: string) => new URLSearchParams(`w=${v}`);

describe('parseImageWidth', () => {
  it('returns null when w is absent or invalid', () => {
    expect(parseImageWidth(new URLSearchParams(''))).toBeNull();
    expect(parseImageWidth(withW('abc'))).toBeNull();
    expect(parseImageWidth(withW('0'))).toBeNull();
    expect(parseImageWidth(withW('-50'))).toBeNull();
  });

  it('snaps to the nearest allowed width and clamps the maximum', () => {
    expect(parseImageWidth(withW('40'))).toBe(48); // below min -> clamps up to 48
    expect(parseImageWidth(withW('64'))).toBe(64);
    expect(parseImageWidth(withW('100'))).toBe(128);
    expect(parseImageWidth(withW('300'))).toBe(400);
    expect(parseImageWidth(withW('5000'))).toBe(720); // clamp to max
  });
});

describe('resizeImageToWebp', () => {
  it('downscales to the target width and re-encodes as webp (smaller bytes)', async () => {
    const src = await sharp({
      create: { width: 1000, height: 800, channels: 3, background: { r: 200, g: 50, b: 50 } },
    })
      .jpeg()
      .toBuffer();

    const out = await resizeImageToWebp(src, 128);
    const meta = await sharp(out).metadata();

    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(128);
    expect(out.length).toBeLessThan(src.length);
  });

  it('never upscales beyond the source width', async () => {
    const src = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const out = await resizeImageToWebp(src, 720);
    const meta = await sharp(out).metadata();

    expect(meta.width).toBe(64);
  });
});

describe('sizedImageSrc', () => {
  it('appends ?w to resize-capable, auth-gated route URLs', () => {
    expect(sizedImageSrc('/api/attendance/selfie/2026/06/emp/a-checkin.jpg', 400)).toBe(
      '/api/attendance/selfie/2026/06/emp/a-checkin.jpg?w=400',
    );
    expect(sizedImageSrc('/api/profile/avatar/2026/06/emp/avatar-x.webp', 80)).toBe(
      '/api/profile/avatar/2026/06/emp/avatar-x.webp?w=80',
    );
  });

  it('uses & when the URL already has a query string', () => {
    expect(sizedImageSrc('/api/profile/avatar/x.webp?v=2', 80)).toBe('/api/profile/avatar/x.webp?v=2&w=80');
  });

  it('leaves non-resizable sources unchanged (blob/data/external)', () => {
    expect(sizedImageSrc('blob:http://x/abc', 80)).toBe('blob:http://x/abc');
    expect(sizedImageSrc('data:image/png;base64,AAAA', 80)).toBe('data:image/png;base64,AAAA');
    expect(sizedImageSrc('https://cdn.example.com/x.png', 80)).toBe('https://cdn.example.com/x.png');
  });

  it('passes through null/undefined', () => {
    expect(sizedImageSrc(null, 80)).toBeUndefined();
    expect(sizedImageSrc(undefined, 80)).toBeUndefined();
  });
});
