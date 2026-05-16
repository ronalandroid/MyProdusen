import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const SELFIE_UPLOAD_DIR = path.join(UPLOAD_DIR, 'selfies');
const PUBLIC_UPLOAD_PATH = '/api/attendance/selfie';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const configuredSelfieSizeMb = Number(process.env.MAX_SELFIE_SIZE_MB || '2');
const configuredUploadBytes = Number(process.env.MAX_UPLOAD_SIZE || '0');
const MAX_IMAGE_BYTES = Number.isFinite(configuredSelfieSizeMb) && configuredSelfieSizeMb > 0
  ? configuredSelfieSizeMb * 1024 * 1024
  : configuredUploadBytes || 2 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/;

export interface UploadResult {
  filename: string;
  path: string;
  mimeType: string;
  size: number;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new UploadError('Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError(`Ukuran selfie terlalu besar. Maksimal ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`);
  }
}

function normalizeMimeType(mimeType: string): string {
  return mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
}

function validateImageSignature(buffer: Buffer, mimeType: string): void {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if ((mimeType === 'image/jpeg' && isJpeg) || (mimeType === 'image/png' && isPng) || (mimeType === 'image/webp' && isWebp)) {
    return;
  }

  throw new UploadError('Konten selfie tidak sesuai dengan tipe gambar.');
}

function validateImageBuffer(buffer: Buffer, mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new UploadError('Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.');
  }

  if (buffer.length === 0) {
    throw new UploadError('Selfie wajib diupload');
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new UploadError(`Ukuran selfie terlalu besar. Maksimal ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`);
  }

  validateImageSignature(buffer, mimeType);
}

export function generateUniqueFilename(mimeType: string): string {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];

  if (!extension) {
    throw new UploadError('Tipe file tidak valid');
  }

  return `${randomUUID()}.${extension}`;
}

export async function saveUploadedImage(file: File): Promise<UploadResult> {
  validateImageFile(file);

  await mkdir(SELFIE_UPLOAD_DIR, { recursive: true });

  const filename = generateUniqueFilename(normalizeMimeType(file.type));
  const filePath = path.join(SELFIE_UPLOAD_DIR, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  validateImageBuffer(buffer, normalizeMimeType(file.type));

  await writeFile(filePath, buffer);

  return {
    filename,
    path: `${PUBLIC_UPLOAD_PATH}/${filename}`,
    mimeType: normalizeMimeType(file.type),
    size: file.size,
  };
}

export async function saveDataUrlImage(dataUrl: string): Promise<UploadResult> {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());

  if (!match) {
    throw new UploadError('Format selfie tidak valid');
  }

  const mimeType = normalizeMimeType(match[1]);
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  validateImageBuffer(buffer, mimeType);

  await mkdir(SELFIE_UPLOAD_DIR, { recursive: true });

  const filename = generateUniqueFilename(mimeType);
  const filePath = path.join(SELFIE_UPLOAD_DIR, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    path: `${PUBLIC_UPLOAD_PATH}/${filename}`,
    mimeType,
    size: buffer.length,
  };
}

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}
