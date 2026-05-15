import { NextRequest } from 'next/server';
import { db, attendances, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { rowsToCsv, csvResponse } from '@/utils/csv-export';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) return forbiddenResponse('Anda tidak memiliki akses');
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const conditions = [];
    if (from) conditions.push(gte(attendances.checkInTime, new Date(from)));
    if (to) conditions.push(lte(attendances.checkInTime, new Date(to)));
    let query = db.select({ attendance: attendances, employee: employees }).from(attendances).leftJoin(employees, eq(attendances.employeeId, employees.id));
    if (conditions.length) query = query.where(and(...conditions)) as any;
    const data = await query.orderBy(desc(attendances.checkInTime));
    const rows = data.map(({ attendance, employee }) => ({
      date: attendance.checkInTime.toISOString().split('T')[0],
      employeeName: employee?.fullName || '',
      nip: employee?.nip || '',
      status: attendance.status,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      lateMinutes: attendance.lateMinutes,
      workingMinutes: attendance.totalWorkMinutes,
    }));
    if (format === 'csv') return csvResponse(rowsToCsv(rows, [
      { key: 'date', label: 'Tanggal' }, { key: 'nip', label: 'NIP' }, { key: 'employeeName', label: 'Nama' },
      { key: 'status', label: 'Status' }, { key: 'checkInTime', label: 'Check In' }, { key: 'checkOutTime', label: 'Check Out' },
      { key: 'lateMinutes', label: 'Terlambat (menit)' }, { key: 'workingMinutes', label: 'Menit Kerja' },
    ]), 'attendance-report.csv');
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil laporan absensi');
  }
}
