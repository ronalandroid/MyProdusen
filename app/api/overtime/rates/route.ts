import { NextRequest } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

const createRateSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  multiplier: z.number().min(1, 'Multiplier minimal 1'),
  description: z.string().optional(),
  isWeekday: z.boolean(),
  isWeekend: z.boolean(),
  isHoliday: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const rates = await overtimeService.getRates(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return successResponse(rates);
  } catch (error: any) {
    console.error('Get overtime rates error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = createRateSchema.parse(body);

    const rate = await overtimeService.createRate(validated);

    return successResponse(rate, undefined, 201);
  } catch (error: any) {
    console.error('Create overtime rate error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
