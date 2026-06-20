import { NextRequest } from 'next/server';
import { reimbursementService } from '@/src/services/reimbursement/reimbursement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { errorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const createClaimSchema = z.object({
  claimDate: z.string().transform((val) => new Date(val)),
  description: z.string().optional(),
  items: z.array(
    z.object({
      categoryId: z.string().min(1),
      description: z.string().min(1),
      amount: z.number().min(0),
      expenseDate: z.string().transform((val) => new Date(val)),
      receipts: z
        .array(
          z.object({
            fileUrl: z.string().url(),
            fileName: z.string(),
            fileSize: z.number(),
            mimeType: z.string(),
          })
        )
        .optional(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Silakan login terlebih dahulu');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};

    // BOLA guard: only SUPERADMIN may read other employees' claims via ?employeeId.
    // Every other authenticated role is hard-scoped to their own employee record,
    // and must have a linked employee to see anything.
    if (user.role === 'SUPERADMIN') {
      const requestedEmployeeId = searchParams.get('employeeId');
      if (requestedEmployeeId) {
        filters.employeeId = requestedEmployeeId;
      }
    } else {
      if (!user.employeeId) {
        return errorResponse('User tidak terhubung dengan karyawan', 403);
      }
      filters.employeeId = user.employeeId;
    }

    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const claims = await reimbursementService.getClaims(filters);

    return successResponse(claims);
  } catch (error: any) {
    logger.error('Get expense claims error', { error });
    return errorResponse('Gagal mengambil klaim reimbursement', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Silakan login terlebih dahulu');
    }

    if (!user.employeeId) {
      return errorResponse('User tidak terhubung dengan karyawan');
    }

    const body = await request.json();
    const validated = createClaimSchema.parse(body);

    const claim = await reimbursementService.createClaim({
      ...validated,
      employeeId: user.employeeId,
    });

    return successResponse(claim, 'Klaim reimbursement berhasil dibuat', 201);
  } catch (error: any) {
    logger.error('Create expense claim error', { error });
    
    if (error.name === 'ZodError') {
      return validationErrorResponse('Data klaim reimbursement tidak valid');
    }

    return errorResponse('Gagal membuat klaim reimbursement', 500);
  }
}
