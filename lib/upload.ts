import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { BusinessError } from '@/lib/core/business-error';

/**
 * Selfie upload module.
 *
 * Files are stored in VPS persistent storage as small compressed images.
 * Only the URL path and metadata are persisted in PostgreSQL — never the
 * binary or base64 payload.
 *
 * Path layout (default driver=local):
 *   {UPLOAD_DIR}/{ATTENDANCE_SELFIE_DIR}/{YYYY}/{MM}/{employeeId}/{attendanceId}-{type}.{ext}
 *
 * Public access path (served through protected API route):
 *   /api/attendance/selfie/{ATTENDANCE_SELFIE_DIR}/{YYYY}/{MM}/{employeeId}/{attendanceId}-{type}.{ext}
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const ATTENDANCE_SELFIE_DIR = process.env.ATTENDANCE_SELFIE_DIR || 'attendance-selfies';
const PROFILE_AVATAR_DIR = process.env.PROFILE_AVATAR_DIR || 'profile-avatars';
const LEGACY_SELFIE_DIR = 'selfies';
const PUBLIC_UPLOAD_PATH = '/api/attendance/selfie';
const PROFILE_AVATAR_ROUTE = '/api/profile/avatar';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const configuredSelfieSizeMb = Number(process.env.MAX_SELFIE_SIZE_MB || '1');
const configuredUploadBytes = Number(process.env.MAX_UPLOAD_SIZE || '0');

/**
 * Backend hard cap. Frontend compresses to ~300KB so 1MB is plenty of headroom.
 * Set MAX_SELFIE_SIZE_MB to override (e.g. for low-bandwidth troubleshooting).
 */
export const MAX_IMAGE_BYTES = Number.isFinite(configuredSelfieSizeMb) && configuredSelfieSizeMb > 0
  ? Math.round(configuredSelfieSizeMb * 1024 * 1024)
  : configuredUploadBytes || 1 * 1024 * 1024;

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const SAFE_DIR_SEGMENT = /^[A-Za-z0-9_-]+$/;
const SAFE_FILENAME = /^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i;

export interface UploadResult {
  filename: string;
  /** Public URL routed through `/api/attendance/selfie/...`. */
  path: string;
  /** Relative storage key (no route prefix). */
  storageKey: string;
  mimeType: string;
  size: number;
}

export type AttendanceSelfieType = 'check-in' | 'check-out';

export interface SaveAttendanceSelfieInput {
  file: File;
  employeeId: string;
  attendanceId: string;
  type: AttendanceSelfieType;
}

export interface SaveProfileAvatarInput {
  file: File;
  employeeId: string;
}

export class UploadError extends BusinessError {
  constructor(message: string) {
    super(message, { status: 400 });
    this.name = 'UploadError';
    Object.setPrototypeOf(this, UploadError.prototype);
  }
}

function normalizeMimeType(mimeType: string): string {
  return mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
}

function safeSegment(value: string, fallback: string): string {
  if (!value || !SAFE_ID_PATTERN.test(value)) {
    return fallback;
  }
  return value;
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

export function buildAttendanceSelfieKey(input: {
  employeeId: string;
  attendanceId: string;
  type: AttendanceSelfieType;
  extension: string;
  date?: Date;
}): string {
  const date = input.date ?? new Date();
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const employee = safeSegment(input.employeeId, 'unknown-employee');
  const attendance = safeSegment(input.attendanceId, randomUUID());
  const typeSegment = input.type === 'check-out' ? 'checkout' : 'checkin';
  return `${ATTENDANCE_SELFIE_DIR}/${year}/${month}/${employee}/${attendance}-${typeSegment}.${input.extension}`;
}

export function buildProfileAvatarKey(input: { employeeId: string; extension: string; date?: Date }): string {
  const date = input.date ?? new Date();
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const employee = safeSegment(input.employeeId, 'unknown-employee');
  return `${PROFILE_AVATAR_DIR}/${year}/${month}/${employee}/avatar-${randomUUID()}.${input.extension}`;
}

export function validateImageFile(file: File): void {
  if (!file || file.size === 0) {
    throw new UploadError('Selfie wajib diupload');
  }

  if (!ALLOWED_MIME_TYPES.has(normalizeMimeType(file.type))) {
    throw new UploadError('Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError(
      `Ukuran selfie terlalu besar. Maksimal ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`,
    );
  }
}

function validateImageSignature(buffer: Buffer, mimeType: string): void {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (
    (mimeType === 'image/jpeg' && isJpeg) ||
    (mimeType === 'image/png' && isPng) ||
    (mimeType === 'image/webp' && isWebp)
  ) {
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
    throw new UploadError(
      `Ukuran selfie terlalu besar. Maksimal ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`,
    );
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

/**
 * Resolve a stored selfie URL/path back to an absolute file path on disk.
 * Supports both legacy flat filenames (uploads/selfies/<file>) and the
 * structured layout (uploads/attendance-selfies/<year>/<month>/...).
 */
export function resolveSelfieStoragePath(input: string): string | null {
  if (!input) {
    return null;
  }

  let key = input.trim();
  if (key.startsWith(`${PUBLIC_UPLOAD_PATH}/`)) {
    key = key.slice(`${PUBLIC_UPLOAD_PATH}/`.length);
  }

  // Reject path traversal early
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) {
    return null;
  }

  const segments = key.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const isLegacyFlat = segments.length === 1;
  const baseDir = isLegacyFlat ? path.join(UPLOAD_DIR, LEGACY_SELFIE_DIR) : UPLOAD_DIR;
  const candidate = path.resolve(path.join(baseDir, ...segments));
  const root = path.resolve(UPLOAD_DIR);

  if (!candidate.startsWith(root + path.sep) && candidate !== root) {
    return null;
  }

  return candidate;
}

export function resolveUploadStoragePath(input: string): string | null {
  if (!input) return null;
  let key = input.trim();
  if (key.startsWith(`${PUBLIC_UPLOAD_PATH}/`)) key = key.slice(`${PUBLIC_UPLOAD_PATH}/`.length);
  if (key.startsWith(`${PROFILE_AVATAR_ROUTE}/`)) key = key.slice(`${PROFILE_AVATAR_ROUTE}/`.length);
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return null;
  const segments = key.split('/').filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => !SAFE_DIR_SEGMENT.test(segment) && !SAFE_FILENAME.test(segment))) return null;
  const candidate = path.resolve(path.join(UPLOAD_DIR, ...segments));
  const root = path.resolve(UPLOAD_DIR);
  if (!candidate.startsWith(root + path.sep) && candidate !== root) return null;
  return candidate;
}

/**
 * @deprecated Prefer saveAttendanceSelfie. Kept for legacy callers that do not
 * know the attendance/employee context yet.
 */
export async function saveUploadedImage(file: File): Promise<UploadResult> {
  validateImageFile(file);

  const legacyDir = path.join(UPLOAD_DIR, LEGACY_SELFIE_DIR);
  await mkdir(legacyDir, { recursive: true });

  const mimeType = normalizeMimeType(file.type);
  const filename = generateUniqueFilename(mimeType);
  const filePath = path.join(legacyDir, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  validateImageBuffer(buffer, mimeType);

  await writeFile(filePath, buffer);

  return {
    filename,
    path: `${PUBLIC_UPLOAD_PATH}/${filename}`,
    storageKey: filename,
    mimeType,
    size: buffer.length,
  };
}

/**
 * Save a realtime selfie for an attendance row. Files are organised by
 * year/month/employeeId so backups and retention sweeps are cheap.
 */
export async function saveAttendanceSelfie(input: SaveAttendanceSelfieInput): Promise<UploadResult> {
  validateImageFile(input.file);

  const mimeType = normalizeMimeType(input.file.type);
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];

  if (!extension) {
    throw new UploadError('Tipe file tidak valid');
  }

  const bytes = await input.file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  validateImageBuffer(buffer, mimeType);

  const key = buildAttendanceSelfieKey({
    employeeId: input.employeeId,
    attendanceId: input.attendanceId,
    type: input.type,
    extension,
  });

  const absolutePath = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    filename: path.basename(absolutePath),
    path: `${PUBLIC_UPLOAD_PATH}/${key}`,
    storageKey: key,
    mimeType,
    size: buffer.length,
  };
}

export async function saveProfileAvatar(input: SaveProfileAvatarInput): Promise<UploadResult> {
  validateImageFile(input.file);
  const mimeType = normalizeMimeType(input.file.type);
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];
  if (!extension) throw new UploadError('Tipe file tidak valid');
  const bytes = await input.file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  validateImageBuffer(buffer, mimeType);
  const key = buildProfileAvatarKey({ employeeId: input.employeeId, extension });
  const absolutePath = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return {
    filename: path.basename(absolutePath),
    path: `${PROFILE_AVATAR_ROUTE}/${key}`,
    storageKey: key,
    mimeType,
    size: buffer.length,
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

  const legacyDir = path.join(UPLOAD_DIR, LEGACY_SELFIE_DIR);
  await mkdir(legacyDir, { recursive: true });

  const filename = generateUniqueFilename(mimeType);
  const filePath = path.join(legacyDir, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    path: `${PUBLIC_UPLOAD_PATH}/${filename}`,
    storageKey: filename,
    mimeType,
    size: buffer.length,
  };
}

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(normalizeMimeType(mimeType));
}
