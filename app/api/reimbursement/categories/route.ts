import { NextRequest } from 'next/server';
import { reimbursementService } from '@/src/services/reimbursement/reimbursement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  maxAmount: z.number().min(0).optional(),
  requiresReceipt: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Silakan login terlebih dahulu');
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const categories = await reimbursementService.getCategories(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return successResponse(categories);
  } catch (error: any) {
    console.error('Get expense categories error:', error);
    return errorResponse('Gagal mengambil kategori reimbursement', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Silakan login terlebih dahulu');
    }

    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Anda tidak memiliki akses membuat kategori reimbursement');
    }

    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    const category = await reimbursementService.createCategory(validated);

    return successResponse(category, 'Kategori reimbursement berhasil dibuat', 201);
  } catch (error: any) {
    console.error('Create expense category error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse('Data kategori reimbursement tidak valid');
    }

    return errorResponse('Gagal membuat kategori reimbursement', 500);
  }
}
