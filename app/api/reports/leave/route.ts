import { NextRequest } from 'next/server';
import { db, leaveRequests, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { rowsToCsv, csvResponse } from '@/utils/csv-export';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) return forbiddenResponse('Anda tidak memiliki akses');
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
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
    if (format === 'csv') return csvResponse(rowsToCsv(rows, [
      { key: 'nip', label: 'NIP' }, { key: 'employeeName', label: 'Nama' }, { key: 'type', label: 'Tipe' },
      { key: 'startDate', label: 'Tanggal Mulai' }, { key: 'endDate', label: 'Tanggal Selesai' },
      { key: 'reason', label: 'Alasan' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Dibuat' },
    ]), 'leave-report.csv');
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil laporan cuti');
  }
}
