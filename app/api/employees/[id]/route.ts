import { NextRequest } from 'next/server';
import { employeeService } from '@/services/employees/employee.service';
import { updateEmployeeSchema } from '@/utils/validation/employee';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

async function canReadEmployee(user: Awaited<ReturnType<typeof requireAuth>>, employee: Awaited<ReturnType<typeof employeeService.getEmployeeById>>) {
  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN_HR') {
    return true;
  }

  const currentEmployee = await employeeService.getEmployeeByUserId(user.userId);

  if (user.role === 'SUPERVISOR') {
    return employee.supervisorId === currentEmployee.id || employee.id === currentEmployee.id;
  }

  return employee.id === currentEmployee.id;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'EMPLOYEE_READ') && !hasPermission(user.role, 'EMPLOYEE_READ_OWN')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat data karyawan');
    }
    
    const employee = await employeeService.getEmployeeById((await context.params).id);

    if (!(await canReadEmployee(user, employee))) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat data karyawan ini');
    }
    
    // Include user role in response
    const { db, users } = await import('@/lib/db');
    const { eq } = await import('drizzle-orm');
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, employee.userId))
      .limit(1);
    
    return successResponse({
      ...employee,
      user: userRecord ? { role: userRecord.role } : undefined,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Karyawan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengambil data karyawan');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'EMPLOYEE_UPDATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk mengubah data karyawan');
    }
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = updateEmployeeSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { id } = await context.params;
    const oldEmployee = await employeeService.getEmployeeById(id);
    const employee = await employeeService.updateEmployee(id, validation.data);
    await logAudit(user.userId, 'UPDATE', 'Employee', id, oldEmployee, employee, request);
    
    return successResponse(employee, 'Data karyawan berhasil diubah');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Karyawan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengubah data karyawan');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, 'EMPLOYEE_DELETE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menghapus data karyawan');
    }

    const { id } = await context.params;
    const oldEmployee = await employeeService.getEmployeeById(id);
    const result = await employeeService.deleteEmployee(id);
    await logAudit(user.userId, 'DELETE', 'Employee', id, oldEmployee, undefined, request);

    return successResponse(result, result.message);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Karyawan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menghapus data karyawan');
  }
}
