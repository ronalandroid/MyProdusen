import { NextRequest } from 'next/server';
import { employeeService } from '@/services/employees/employee.service';
import { createEmployeeSchema } from '@/utils/validation/employee';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'EMPLOYEE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat data karyawan');
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
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat daftar karyawan');
    }
    
    const employees = await employeeService.getEmployees(filters);
    
    return successResponse(employees);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil data karyawan');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'EMPLOYEE_CREATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat karyawan');
    }
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = createEmployeeSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const employee = await employeeService.createEmployee(validation.data);
    await logAudit(user.userId, 'CREATE', 'Employee', employee.id, undefined, employee, request);
    
    return successResponse(employee, 'Karyawan berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat karyawan');
  }
}
