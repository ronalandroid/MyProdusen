import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

const updateStructureSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  baseSalary: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const structure = await payrollService.getStructureById(params.id);

    return successResponse(structure);
  } catch (error: any) {
    console.error('Get payroll structure error:', error);
    return errorResponse(error.message || 'Internal server error', error.message.includes('tidak ditemukan') ? 404 : 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = updateStructureSchema.parse(body);

    const structure = await payrollService.updateStructure(params.id, validated);

    return successResponse(structure);
  } catch (error: any) {
    console.error('Update payroll structure error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse(error.message || 'Internal server error', error.message.includes('tidak ditemukan') ? 404 : 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse();
    }

    await payrollService.deleteStructure(params.id);

    return successResponse(null);
  } catch (error: any) {
    console.error('Delete payroll structure error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
