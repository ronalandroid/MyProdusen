import { NextRequest } from 'next/server';
import { employeeService } from '@/services/employees/employee.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { z } from 'zod';

const createProfileSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  phone: z.string().optional(),
  address: z.string().optional(),
  division: z.string().optional(),
  position: z.string().optional(),
  supervisorId: z.string().optional(),
  defaultShiftId: z.string().optional(),
  defaultLocationId: z.string().optional(),
  joinDate: z.string().optional(),
});

export const POST = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const actor = await requireAuth(request);
  const resolvedParams = await params;

  // Reusing EMPLOYEE_CREATE permission because this effectively creates an employee profile
  if (!hasPermission(actor.role, 'EMPLOYEE_CREATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat profil karyawan');
  }

  const userId = resolvedParams.id;
  const data = await parseJsonBody(request, createProfileSchema);

  const employee = await employeeService.createEmployeeProfileForUser(userId, data);
  await logAudit(actor.userId, 'CREATE', 'Employee', employee.id, undefined, employee, request);

  return successResponse(employee, 'Profil karyawan berhasil dibuat');
});
