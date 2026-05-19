import { NextRequest, NextResponse } from 'next/server';
import { reimbursementService } from '@/src/services/reimbursement/reimbursement.service';
import { getCurrentUser } from '@/lib/auth-context';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const categories = await reimbursementService.getCategories(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return NextResponse.json({ data: categories });
  } catch (error: any) {
    console.error('Get expense categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    const category = await reimbursementService.createCategory(validated);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error: any) {
    console.error('Create expense category error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
