import { NextRequest } from 'next/server';
import { db, leaveRequests, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { rowsToCsv, csvResponse } from '@/utils/csv-export';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'REPORT_VIEW')) return forbiddenResponse('Anda tidak memiliki akses');
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const preset = searchParams.get('preset');
    const conditions = [];
    if (from) conditions.push(gte(leaveRequests.startDate, new Date(from)));
    if (to) conditions.push(lte(leaveRequests.endDate, new Date(to)));
    if (status) conditions.push(eq(leaveRequests.status, status as any));
    let query = db.select({ leave: leaveRequests, employee: employees }).from(leaveRequests).leftJoin(employees, eq(leaveRequests.employeeId, employees.id));
    if (conditions.length) query = query.where(and(...conditions)) as any;
    const data = await query.orderBy(desc(leaveRequests.createdAt));
    const rows = data.map(({ leave, employee }) => ({
      employeeName: employee?.fullName || '',
      nip: employee?.nip || '',
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
      createdAt: leave.createdAt,
    }));
    if (format === 'csv') {
      if (!hasPermission(user.role, 'REPORT_EXPORT')) return forbiddenResponse('Anda tidak memiliki akses export laporan');
      await logAudit(user.userId, 'EXPORT', 'LeaveReport', preset || 'leave', undefined, { from, to, status, preset }, request);
      return csvResponse(rowsToCsv(rows, [
      { key: 'nip', label: 'NIP' }, { key: 'employeeName', label: 'Nama' }, { key: 'type', label: 'Tipe' },
      { key: 'startDate', label: 'Tanggal Mulai' }, { key: 'endDate', label: 'Tanggal Selesai' },
      { key: 'reason', label: 'Alasan' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Dibuat' },
    ]), buildReportFilename(preset || 'leave', from, to));
    }
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

function buildReportFilename(name: string, from: string | null, to: string | null) {
  const safeName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const range = from || to ? `-${from || 'start'}-to-${to || 'end'}` : '';
  return `${safeName}-report${range}.csv`;
}
