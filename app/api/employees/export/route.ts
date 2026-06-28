import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { employeeService } from '@/services/employees/employee.service';
import { logAudit } from '@/lib/audit';
import { buildXlsx, xlsxDownloadHeaders, type ExcelColumn } from '@/lib/excel/workbook';

const COLUMNS: ExcelColumn[] = [
  { header: 'NIP', key: 'nip', format: 'text' },
  { header: 'Nama Lengkap', key: 'name', format: 'text' },
  { header: 'Email', key: 'email', format: 'text' },
  { header: 'Divisi', key: 'division', format: 'text' },
  { header: 'Posisi', key: 'position', format: 'text' },
  { header: 'Status', key: 'status', format: 'text' },
  { header: 'Tanggal Bergabung', key: 'joinDate', format: 'date' },
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'EMPLOYEE_READ')) return forbiddenResponse('Anda tidak memiliki akses');

    const employees = await employeeService.getEmployees();
    const rows = employees.map((e) => ({
      nip: e.nip,
      name: e.fullName,
      email: e.email,
      division: e.division ?? '',
      position: e.position ?? '',
      status: e.status,
      joinDate: e.joinDate ? new Date(e.joinDate) : null,
    }));

    const buffer = await buildXlsx([{ name: 'Karyawan', columns: COLUMNS, rows }]);
    await logAudit(user.userId, 'EXPORT', 'Employee', 'xlsx', undefined, { count: rows.length }, request);

    return new Response(new Uint8Array(buffer), {
      headers: xlsxDownloadHeaders(`karyawan_${new Date().toISOString().slice(0, 10)}.xlsx`),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
