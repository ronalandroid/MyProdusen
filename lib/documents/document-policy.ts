import type { UserRole } from '@/lib/permissions';

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function isAllowedDocumentMimeType(mimeType: string): boolean {
  return allowedMimeTypes.has(mimeType);
}

export function canAccessEmployeeDocument(input: {
  role: UserRole;
  userEmployeeId?: string;
  targetEmployeeId: string;
}): boolean {
  if (input.role === 'SUPERADMIN' || input.role === 'ADMIN_HR') {
    return true;
  }

  if (input.role === 'EMPLOYEE') {
    return input.userEmployeeId === input.targetEmployeeId;
  }

  return input.userEmployeeId === input.targetEmployeeId;
}
