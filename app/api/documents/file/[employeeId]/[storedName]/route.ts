import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, employeeDocuments } from '@/lib/db';
import { employeeService } from '@/services/employees/employee.service';
import { requireAuth } from '@/lib/middleware';
import { canAccessEmployeeDocument } from '@/lib/documents/document-policy';
import { buildProtectedDocumentUrl, readEmployeeDocumentFile } from '@/lib/documents/document-storage';
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

interface RouteContext {
  params: Promise<{ employeeId: string; storedName: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const currentEmployee = await employeeService.getEmployeeByUserId(user.userId).catch(() => null);
    const { employeeId, storedName } = await context.params;

    if (!canAccessEmployeeDocument({ role: user.role, userEmployeeId: currentEmployee?.id, targetEmployeeId: employeeId })) {
      return forbiddenResponse('Anda tidak memiliki akses dokumen ini');
    }

    const fileUrl = buildProtectedDocumentUrl(employeeId, storedName);
    const [document] = await db
      .select({ id: employeeDocuments.id, fileName: employeeDocuments.fileName, mimeType: employeeDocuments.mimeType })
      .from(employeeDocuments)
      .where(and(eq(employeeDocuments.employeeId, employeeId), eq(employeeDocuments.fileUrl, fileUrl)))
      .limit(1);

    if (!document) {
      return notFoundResponse('Dokumen tidak ditemukan');
    }

    const file = await readEmployeeDocumentFile(employeeId, storedName);

    if (user.role === 'SUPERADMIN' && currentEmployee?.id !== employeeId) {
      await logAudit(user.userId, 'DOCUMENT_VIEW', 'EmployeeDocument', document.id, undefined, { employeeId }, request);
    }

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `inline; filename="${document.fileName.replace(/"/g, '')}"`,
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse('Gagal membuka dokumen', 500);
  }
}
