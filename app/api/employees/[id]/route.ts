import { NextRequest } from 'next/server';
import { employeeService } from '@/features/employees/employee.service';
import { updateEmployeeSchema } from '@/lib/validations/employee';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';

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
    
    return successResponse(employee);
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
    
    const employee = await employeeService.updateEmployee((await context.params).id, validation.data);
    
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
