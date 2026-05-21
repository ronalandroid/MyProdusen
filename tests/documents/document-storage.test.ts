import { describe, expect, it } from 'vitest';
import { buildDocumentStoragePath, buildProtectedDocumentUrl, sanitizeOriginalFilename } from '@/lib/documents/document-storage';

describe('document storage', () => {
  it('sanitizes unsafe original filenames', () => {
    expect(sanitizeOriginalFilename('../../contract final.pdf')).toBe('contract-final.pdf');
  });

  it('stores documents under employee scoped private path', () => {
    expect(buildDocumentStoragePath('emp_123', 'doc_456', 'contract.pdf')).toBe('employee-documents/emp_123/doc_456-contract.pdf');
  });

  it('builds protected API document URLs instead of public upload paths', () => {
    expect(buildProtectedDocumentUrl('emp_123', 'doc_456-contract.pdf')).toBe('/api/documents/file/emp_123/doc_456-contract.pdf');
  });
});
