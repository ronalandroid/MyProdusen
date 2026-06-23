/**
 * Realtime selfie compressor.
 *
 * Runs entirely on the client through HTMLCanvasElement so the VPS never
 * receives raw camera frames. Targets the configurable values from the
 * NEXT_PUBLIC_SELFIE_* env vars or the documented defaults:
 *   - max 720x720
 *   - quality 0.75
 *   - target ~200KB
 *   - prefer WebP, fallback JPEG
 */

const DEFAULT_MAX_WIDTH = 720;
const DEFAULT_MAX_HEIGHT = 720;
const DEFAULT_QUALITY = 0.75;
const DEFAULT_TARGET_KB = 200;
const HARD_MAX_KB = 500;

function readEnvNumber(key: string, fallback: number): number {
  const raw = (typeof process !== 'undefined' ? process.env?.[key] : undefined) as string | undefined;
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const MAX_WIDTH = readEnvNumber('NEXT_PUBLIC_SELFIE_MAX_WIDTH', DEFAULT_MAX_WIDTH);
const MAX_HEIGHT = readEnvNumber('NEXT_PUBLIC_SELFIE_MAX_HEIGHT', DEFAULT_MAX_HEIGHT);
const BASE_QUALITY = Math.min(
  Math.max(readEnvNumber('NEXT_PUBLIC_SELFIE_IMAGE_QUALITY', DEFAULT_QUALITY), 0.4),
  0.95,
);
const TARGET_BYTES = readEnvNumber('NEXT_PUBLIC_SELFIE_TARGET_SIZE_KB', DEFAULT_TARGET_KB) * 1024;
const HARD_LIMIT_BYTES = HARD_MAX_KB * 1024;

export interface CompressedSelfie {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  quality: number;
  size: number;
  exceedsTarget: boolean;
  exceedsHardLimit: boolean;
}

function pickOutputMime(): string {
  if (typeof document === 'undefined') {
    return 'image/jpeg';
  }
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const dataUrl = probe.toDataURL('image/webp');
  return dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
}

function calcDimensions(srcWidth: number, srcHeight: number) {
  if (srcWidth <= MAX_WIDTH && srcHeight <= MAX_HEIGHT) {
    return { width: srcWidth, height: srcHeight };
  }
  const ratio = Math.min(MAX_WIDTH / srcWidth, MAX_HEIGHT / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mime,
      quality,
    );
  });
}

/**
 * Capture the current frame from a <video> element and produce a compressed
 * Blob suitable for upload. Falls back to JPEG if WebP is unsupported.
 */
export async function captureSelfieFromVideo(video: HTMLVideoElement, mirror = true): Promise<CompressedSelfie> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('Kamera belum siap untuk mengambil selfie.');
  }

  const { width, height } = calcDimensions(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser tidak mendukung pengolahan canvas selfie.');
  }
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    ctx.drawImage(video, 0, 0, width, height);
  }

  const mime = pickOutputMime();

  let quality = BASE_QUALITY;
  let blob = await canvasToBlob(canvas, mime, quality);

  // Step down quality if oversized. Stop at 0.5 to keep faces recognisable.
  while (blob && blob.size > TARGET_BYTES && quality > 0.5) {
    quality = Math.max(0.5, Number((quality - 0.1).toFixed(2)));
    blob = await canvasToBlob(canvas, mime, quality);
  }

  if (!blob) {
    throw new Error('Gagal mengompres selfie. Silakan coba ambil ulang.');
  }

  return {
    blob,
    mimeType: blob.type || mime,
    width,
    height,
    quality,
    size: blob.size,
    exceedsTarget: blob.size > TARGET_BYTES,
    exceedsHardLimit: blob.size > HARD_LIMIT_BYTES,
  };
}

export const SELFIE_COMPRESSOR_LIMITS = {
  maxWidth: MAX_WIDTH,
  maxHeight: MAX_HEIGHT,
  baseQuality: BASE_QUALITY,
  targetBytes: TARGET_BYTES,
  hardLimitBytes: HARD_LIMIT_BYTES,
};
