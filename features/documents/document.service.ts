import { db, employeeDocuments } from '@/lib/db';
import { and, desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { isAllowedDocumentMimeType } from '@/lib/documents/document-policy';

export type DocumentCategory = 'CONTRACT' | 'CERTIFICATE' | 'ID' | 'EDUCATION' | 'MEDICAL' | 'OTHER';

export class DocumentService {
  async listDocuments(employeeId: string) {
    return db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(desc(employeeDocuments.createdAt));
  }

  async createDocument(data: {
    employeeId: string;
    category: DocumentCategory;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    expiryDate?: Date;
  }) {
    if (!isAllowedDocumentMimeType(data.mimeType)) {
      throw new Error('Tipe dokumen tidak diizinkan');
    }

    if (data.fileSize > 10 * 1024 * 1024) {
      throw new Error('Ukuran dokumen maksimal 10MB');
    }

    const [created] = await db.insert(employeeDocuments).values({
      id: uuidv4(),
      employeeId: data.employeeId,
      category: data.category,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy,
      expiryDate: data.expiryDate,
      status: 'APPROVED',
    }).returning();

    return created;
  }
}

export const documentService = new DocumentService();
