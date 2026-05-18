import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

const createStructureSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  baseSalary: z.number().min(0, 'Gaji pokok harus positif'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Only SUPERADMIN and ADMIN_HR can view payroll structures
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const structures = await payrollService.getStructures(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return successResponse(structures);
  } catch (error: any) {
    console.error('Get payroll structures error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Only SUPERADMIN and ADMIN_HR can create payroll structures
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = createStructureSchema.parse(body);

    const structure = await payrollService.createStructure(validated);

    return successResponse(structure, undefined, 201);
  } catch (error: any) {
    console.error('Create payroll structure error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
