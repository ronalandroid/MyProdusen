/**
 * File Upload Module
 * Handles secure file uploads for selfies and other attachments
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  uploadDir: string;
}

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

const DEFAULT_CONFIG: UploadConfig = {
  maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE || '5242880'), // 5MB default
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  uploadDir: process.env.UPLOAD_DIR || './public/uploads',
};

/**
 * Validate file data URL
 */
export function validateDataUrl(dataUrl: string): { valid: boolean; error?: string; mimeType?: string; data?: Buffer } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, error: 'Invalid data URL' };
  }

  // Check if it's a data URL
  const dataUrlPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/;
  const matches = dataUrl.match(dataUrlPattern);

  if (!matches) {
    return { valid: false, error: 'Invalid data URL format' };
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Validate MIME type
  if (!DEFAULT_CONFIG.allowedMimeTypes.includes(mimeType)) {
    return { 
      valid: false, 
      error: `Tipe file tidak didukung. Hanya ${DEFAULT_CONFIG.allowedMimeTypes.join(', ')} yang diperbolehkan` 
    };
  }

  // Decode base64
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (error) {
    return { valid: false, error: 'Invalid base64 data' };
  }

  // Check file size
  if (buffer.length > DEFAULT_CONFIG.maxSizeBytes) {
    const maxSizeMB = (DEFAULT_CONFIG.maxSizeBytes / 1024 / 1024).toFixed(1);
    return { 
      valid: false, 
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB` 
    };
  }

  return { valid: true, mimeType, data: buffer };
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(mimeType: string, prefix: string = 'file'): string {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const extension = mimeType.split('/')[1] || 'jpg';
  
  return `${prefix}_${timestamp}_${randomHash}.${extension}`;
}

/**
 * Save data URL to file system
 */
export async function saveDataUrlToFile(
  dataUrl: string,
  subDir: string = 'selfies',
  prefix: string = 'selfie'
): Promise<UploadResult> {
  // Validate data URL
  const validation = validateDataUrl(dataUrl);
  if (!validation.valid || !validation.data || !validation.mimeType) {
    throw new Error(validation.error || 'Invalid file');
  }

  // Create upload directory if it doesn't exist
  const uploadPath = path.join(DEFAULT_CONFIG.uploadDir, subDir);
  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true });
  }

  // Generate secure filename
  const filename = generateSecureFilename(validation.mimeType, prefix);
  const filePath = path.join(uploadPath, filename);

  // Write file
  await writeFile(filePath, validation.data);

  // Generate public URL
  const publicUrl = `/uploads/${subDir}/${filename}`;

  return {
    filename,
    path: filePath,
    url: publicUrl,
    size: validation.data.length,
    mimeType: validation.mimeType,
  };
}

/**
 * Save attendance selfie
 */
export async function saveAttendanceSelfie(
  dataUrl: string,
  employeeId: string,
  type: 'check-in' | 'check-out'
): Promise<UploadResult> {
  const prefix = `${type}_${employeeId}`;
  return saveDataUrlToFile(dataUrl, 'attendance', prefix);
}

/**
 * Save employee profile photo
 */
export async function saveEmployeePhoto(
  dataUrl: string,
  employeeId: string
): Promise<UploadResult> {
  const prefix = `profile_${employeeId}`;
  return saveDataUrlToFile(dataUrl, 'profiles', prefix);
}

/**
 * Validate image dimensions (optional, requires image processing library)
 */
export function validateImageDimensions(
  width: number,
  height: number,
  minWidth: number = 200,
  minHeight: number = 200,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): { valid: boolean; error?: string } {
  if (width < minWidth || height < minHeight) {
    return { 
      valid: false, 
      error: `Resolusi gambar terlalu kecil. Minimal ${minWidth}x${minHeight}px` 
    };
  }

  if (width > maxWidth || height > maxHeight) {
    return { 
      valid: false, 
      error: `Resolusi gambar terlalu besar. Maksimal ${maxWidth}x${maxHeight}px` 
    };
  }

  return { valid: true };
}

/**
 * Clean up old files (for maintenance)
 */
export async function cleanupOldFiles(
  subDir: string,
  daysOld: number = 90
): Promise<{ deleted: number; errors: number }> {
  // TODO: Implement file cleanup logic
  // This should be run as a scheduled job
  return { deleted: 0, errors: 0 };
}
