import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { isAllowedDocumentMimeType } from './document-policy';

const DOCUMENT_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'employee-documents');
const PUBLIC_DOCUMENT_PATH = '/uploads/employee-documents';
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function sanitizeOriginalFilename(filename: string): string {
  const baseName = path.basename(filename).trim().toLowerCase();
  return baseName
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'document';
}

export function buildDocumentStoragePath(employeeId: string, documentId: string, filename: string): string {
  return `employee-documents/${employeeId}/${documentId}-${sanitizeOriginalFilename(filename)}`;
}

export async function saveEmployeeDocumentFile(employeeId: string, file: File) {
  if (!isAllowedDocumentMimeType(file.type)) {
    throw new Error('Tipe dokumen tidak diizinkan');
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Ukuran dokumen maksimal 10MB');
  }

  const documentId = randomUUID();
  const safeName = sanitizeOriginalFilename(file.name);
  const employeeDir = path.join(DOCUMENT_UPLOAD_DIR, employeeId);
  await mkdir(employeeDir, { recursive: true });

  const storedName = `${documentId}-${safeName}`;
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(employeeDir, storedName), Buffer.from(bytes));

  return {
    documentId,
    fileName: safeName,
    fileUrl: `${PUBLIC_DOCUMENT_PATH}/${employeeId}/${storedName}`,
    fileSize: file.size,
    mimeType: file.type,
  };
}
