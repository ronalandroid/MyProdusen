import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { assertPdfReportAccess } from '@/lib/reports/pdf-report';
import { buildEmployeeTrackRecord } from '@/lib/reports/employee-track-record';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    assertPdfReportAccess(user.role);

    const rl = await rateLimit(request, RATE_LIMITS.API_STRICT, 'reports:track-record');
    if (rl.limited) {
      return errorResponse('Terlalu banyak permintaan laporan. Coba lagi sebentar.', 429);
    }

    const { id } = await params;
    const result = await buildEmployeeTrackRecord(id, user.email);
    if (!result.found || !result.pdf) {
      return errorResponse('Karyawan tidak ditemukan', 404);
    }

    await logAudit(user.userId, 'DOWNLOAD_PDF', 'EmployeeTrackRecord', id, undefined, { employeeName: result.employeeName }, request);

    const safeName = (result.employeeName || 'karyawan').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    return new NextResponse(Buffer.from(result.pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="track-record-${safeName}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'PDF_REPORT_FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat mengunduh track record');
    return handleApiError(error);
  }
}
