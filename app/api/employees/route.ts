import { NextRequest } from 'next/server';
import { employeeService } from '@/services/employees/employee.service';
import { createEmployeeSchema } from '@/utils/validation/employee';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { canManageRole, hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { parsePagination } from '@/lib/api/pagination';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'EMPLOYEE_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat data karyawan');
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    status: searchParams.get('status') as any,
    division: searchParams.get('division') || undefined,
    supervisorId: searchParams.get('supervisorId') || undefined,
    search: searchParams.get('search') || undefined,
  };

  if (user.role === 'SUPERVISOR') {
    const supervisor = await employeeService.getEmployeeByUserId(user.userId);
    filters.supervisorId = supervisor.id;
  } else if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat daftar karyawan');
  }

  const pagination = parsePagination(searchParams);
  const employees = await employeeService.getEmployeesPaginated(filters, pagination);
  const response = successResponse(employees.items);
  response.headers.set('X-Pagination', JSON.stringify(employees.pagination));

  return response;
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'EMPLOYEE_CREATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat karyawan');
  }

  const data = await parseJsonBody(request, createEmployeeSchema);
  const assignedRole = data.role ?? 'EMPLOYEE';

  if (!canManageRole(user.role, assignedRole)) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat role tersebut');
  }

  const employee = await employeeService.createEmployee({ ...data, role: assignedRole });
  await logAudit(user.userId, 'CREATE', 'Employee', employee.id, undefined, employee, request);

  return successResponse(employee, 'Karyawan berhasil dibuat');
});
