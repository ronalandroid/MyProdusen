import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { employeeService } from '@/services/employees/employee.service';
import { createEmployeeSchema } from '@/utils/validation/employee';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { canManageRole, hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { parsePagination } from '@/lib/api/pagination';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { calculateWorkDurationDays } from '@/src/services/employees/work-duration.service';

import { isTestSpriteCompatEnabled } from '@/lib/testsprite';
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

  const pagination = parsePagination(searchParams);
  const employees = await employeeService.getEmployeesPaginated(filters, pagination);
  const response = successResponse(employees.items.map((employee: any) => ({
    ...employee,
    workDurationDays: calculateWorkDurationDays(employee.workStartDate || employee.joinDate || null),
    scorePercentage: employee.scorePercentage ?? null,
    payrollStatusSummary: user.role === 'SUPERADMIN' ? 'Estimasi privat' : undefined,
  })));
  response.headers.set('X-Pagination', JSON.stringify(employees.pagination));

  return response;
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'EMPLOYEE_CREATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat karyawan');
  }

  const data = isTestSpriteCompatEnabled()
    ? createEmployeeSchema.parse(toTestSpriteEmployeePayload(await request.json().catch(() => undefined)))
    : await parseJsonBody(request, createEmployeeSchema);
  const assignedRole = data.role ?? 'EMPLOYEE';

  if (!canManageRole(user.role, assignedRole)) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat role tersebut');
  }

  const employee = await employeeService.createEmployee({ ...data, role: assignedRole });
  await logAudit(user.userId, 'CREATE', 'Employee', employee.id, undefined, employee, request);

  if (isTestSpriteCompatEnabled()) {
    return NextResponse.json({ success: true, data: employee, ...employee, user: { id: employee.userId } });
  }

  return successResponse(employee, 'Karyawan berhasil dibuat');
});

function toTestSpriteEmployeePayload(body: any) {
  if (!body?.user) {
    const email = body?.email ?? (typeof body?.username === 'string' && body.username.includes('@') ? body.username : undefined);
    const username = body?.username ?? (typeof email === 'string' ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : undefined);
    return {
      ...body,
      fullName: body?.fullName ?? body?.name,
      email,
      username,
      password: body?.password,
      role: typeof body?.role === 'string' ? body.role.toUpperCase() : body?.role,
      joinDate: body?.joinDate ?? body?.join_date,
      division: body?.division ?? body?.department,
    };
  }

  return {
    fullName: [body.employee?.firstName ?? body.first_name, body.employee?.lastName ?? body.last_name].filter(Boolean).join(' ') || body.user.username,
    email: body.user.email,
    username: body.user.username,
    password: body.user.password,
    role: 'EMPLOYEE',
    joinDate: body.employee?.joinDate ?? body.join_date,
    division: body.employee?.department ?? body.department,
    position: body.employee?.position ?? body.position,
  };
}
