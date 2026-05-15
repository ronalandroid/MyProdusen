import { describe, expect, it } from 'vitest';
import { canAccessEmployeeDocument, isAllowedDocumentMimeType } from '@/lib/documents/document-policy';

describe('document policy', () => {
  it('allows employees to access only own documents', () => {
    expect(canAccessEmployeeDocument({ role: 'EMPLOYEE', userEmployeeId: 'emp1', targetEmployeeId: 'emp1' })).toBe(true);
    expect(canAccessEmployeeDocument({ role: 'EMPLOYEE', userEmployeeId: 'emp1', targetEmployeeId: 'emp2' })).toBe(false);
  });

  it('allows HR roles to access all employee documents', () => {
    expect(canAccessEmployeeDocument({ role: 'ADMIN_HR', targetEmployeeId: 'emp2' })).toBe(true);
    expect(canAccessEmployeeDocument({ role: 'SUPERADMIN', targetEmployeeId: 'emp2' })).toBe(true);
  });

  it('accepts PDF and common image documents only', () => {
    expect(isAllowedDocumentMimeType('application/pdf')).toBe(true);
    expect(isAllowedDocumentMimeType('image/png')).toBe(true);
    expect(isAllowedDocumentMimeType('application/x-msdownload')).toBe(false);
  });
});
