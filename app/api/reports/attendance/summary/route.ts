import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse,
} from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { fetchAttendanceSummary } from '@/lib/reports/attendance-history';
import { resolveAttendanceReportRequest } from '@/lib/reports/attendance-history-access';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, 'REPORT_VIEW') && user.role !== 'EMPLOYEE') {
      return forbiddenResponse('Anda tidak memiliki akses laporan absensi.');
    }

    const { searchParams } = new URL(request.url);
    const resolution = await resolveAttendanceReportRequest(searchParams, user, 'view');
    if (!resolution.ok) {
      if (resolution.status === 403) return forbiddenResponse(resolution.error);
      return errorResponse(resolution.error, resolution.status);
    }

    const summary = await fetchAttendanceSummary(resolution.resolved.filters);
    return successResponse({ summary, scope: resolution.resolved.scope });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil ringkasan laporan absensi');
  }
}
