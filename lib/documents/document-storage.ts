import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { isAllowedDocumentMimeType } from './document-policy';

const DOCUMENT_STORAGE_FOLDER = 'employee-documents';
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

function getUploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}

function getDocumentUploadDir(): string {
  return path.join(getUploadRoot(), DOCUMENT_STORAGE_FOLDER);
}

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

export function buildProtectedDocumentUrl(employeeId: string, storedName: string): string {
  return `/api/documents/file/${encodeURIComponent(employeeId)}/${encodeURIComponent(storedName)}`;
}

export async function readEmployeeDocumentFile(employeeId: string, storedName: string) {
  const safeStoredName = sanitizeOriginalFilename(storedName);
  if (safeStoredName !== storedName) {
    throw new Error('Nama file dokumen tidak valid');
  }

  const root = getDocumentUploadDir();
  const fullPath = path.resolve(root, employeeId, safeStoredName);
  const employeeDir = path.resolve(root, employeeId);

  if (!fullPath.startsWith(`${employeeDir}${path.sep}`)) {
    throw new Error('Path dokumen tidak valid');
  }

  return readFile(fullPath);
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
  const employeeDir = path.join(getDocumentUploadDir(), employeeId);
  await mkdir(employeeDir, { recursive: true });

  const storedName = `${documentId}-${safeName}`;
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(employeeDir, storedName), Buffer.from(bytes));

  return {
    documentId,
    fileName: safeName,
    fileUrl: buildProtectedDocumentUrl(employeeId, storedName),
    fileSize: file.size,
    mimeType: file.type,
  };
}
