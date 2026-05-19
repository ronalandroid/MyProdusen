import { NextRequest } from 'next/server';
import { db, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { rowsToCsv, csvResponse } from '@/utils/csv-export';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN'].includes(user.role)) return forbiddenResponse('Anda tidak memiliki akses');
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const status = searchParams.get('status');
    let query = db.select().from(employees);
    if (status) query = query.where(eq(employees.status, status as any)) as any;
    const data = await query.orderBy(desc(employees.createdAt));
    const rows = data.map((emp) => ({
      nip: emp.nip,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone || '',
      division: emp.division || '',
      position: emp.position || '',
      status: emp.status,
      joinDate: emp.joinDate,
    }));
    if (format === 'csv') return csvResponse(rowsToCsv(rows, [
      { key: 'nip', label: 'NIP' }, { key: 'fullName', label: 'Nama Lengkap' }, { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telepon' }, { key: 'division', label: 'Divisi' }, { key: 'position', label: 'Jabatan' },
      { key: 'status', label: 'Status' }, { key: 'joinDate', label: 'Tanggal Masuk' },
    ]), 'employees-report.csv');
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil laporan karyawan');
  }
}
