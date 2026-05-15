import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN can change user roles
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat mengubah role pengguna');
    }
    
    const { id } = await context.params;
    const body = await request.json();
    const { role } = body;
    
    if (!role || !['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'].includes(role)) {
      return validationErrorResponse('Role tidak valid. Pilih: SUPERADMIN, ADMIN_HR, SUPERVISOR, atau EMPLOYEE');
    }
    
    // Get employee to find userId
    const { employees } = await import('@/lib/db');
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    
    if (!employee) {
      return errorResponse('Karyawan tidak ditemukan', 404);
    }
    
    // Get old user data for audit
    const [oldUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, employee.userId))
      .limit(1);
    
    if (!oldUser) {
      return errorResponse('User tidak ditemukan', 404);
    }
    
    // Update user role
    const [updatedUser] = await db
      .update(users)
      .set({ 
        role: role as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, employee.userId))
      .returning();
    
    await logAudit(
      user.userId,
      'UPDATE_ROLE',
      'User',
      employee.userId,
      { role: oldUser.role },
      { role: updatedUser.role },
      request
    );
    
    return successResponse(
      { 
        employeeId: employee.id,
        userId: employee.userId,
        oldRole: oldUser.role,
        newRole: updatedUser.role,
      },
      `Role berhasil diubah dari ${oldUser.role} ke ${updatedUser.role}`
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengubah role');
  }
}
