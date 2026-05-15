import { NextRequest } from 'next/server';
import { z } from 'zod';
import { documentService } from '@/features/documents/document.service';
import { employeeService } from '@/services/employees/employee.service';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { canAccessEmployeeDocument } from '@/lib/documents/document-policy';
import { logAudit } from '@/lib/audit';

const createDocumentSchema = z.object({
  employeeId: z.string().optional(),
  category: z.enum(['CONTRACT', 'CERTIFICATE', 'ID', 'EDUCATION', 'MEDICAL', 'OTHER']),
  title: z.string().min(3),
  description: z.string().optional(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  expiryDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const currentEmployee = await employeeService.getEmployeeByUserId(user.userId).catch(() => null);
    const { searchParams } = new URL(request.url);
    const targetEmployeeId = searchParams.get('employeeId') || currentEmployee?.id;

    if (!targetEmployeeId) return errorResponse('Data karyawan tidak ditemukan');
    if (!canAccessEmployeeDocument({ role: user.role, userEmployeeId: currentEmployee?.id, targetEmployeeId })) {
      return forbiddenResponse('Anda tidak memiliki akses dokumen ini');
    }

    const documents = await documentService.listDocuments(targetEmployeeId);
    return successResponse(documents);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil dokumen');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const currentEmployee = await employeeService.getEmployeeByUserId(user.userId).catch(() => null);
    const body = await getRequestBody(request);
    const validation = createDocumentSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const targetEmployeeId = validation.data.employeeId || currentEmployee?.id;
    if (!targetEmployeeId) return errorResponse('Data karyawan tidak ditemukan');
    if (!canAccessEmployeeDocument({ role: user.role, userEmployeeId: currentEmployee?.id, targetEmployeeId })) {
      return forbiddenResponse('Anda tidak memiliki akses upload dokumen ini');
    }

    const created = await documentService.createDocument({
      ...validation.data,
      employeeId: targetEmployeeId,
      uploadedBy: user.userId,
      expiryDate: validation.data.expiryDate ? new Date(validation.data.expiryDate) : undefined,
    });
    await logAudit(user.userId, 'CREATE', 'EmployeeDocument', created.id, undefined, created, request);

    return successResponse(created, 'Dokumen berhasil ditambahkan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menyimpan dokumen');
  }
}
