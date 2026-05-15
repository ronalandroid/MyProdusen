import { describe, expect, it } from 'vitest';
import { buildDocumentStoragePath, sanitizeOriginalFilename } from '@/lib/documents/document-storage';

describe('document storage', () => {
  it('sanitizes unsafe original filenames', () => {
    expect(sanitizeOriginalFilename('../../contract final.pdf')).toBe('contract-final.pdf');
  });

  it('stores documents under employee scoped private path', () => {
    expect(buildDocumentStoragePath('emp_123', 'doc_456', 'contract.pdf')).toBe('employee-documents/emp_123/doc_456-contract.pdf');
  });
});
