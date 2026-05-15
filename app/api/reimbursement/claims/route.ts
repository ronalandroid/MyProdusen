import { NextRequest, NextResponse } from 'next/server';
import { reimbursementService } from '@/src/services/reimbursement/reimbursement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};

    // Employee can only see their own claims
    if (user.role === 'EMPLOYEE') {
      filters.employeeId = user.employeeId;
    } else if (searchParams.get('employeeId')) {
      filters.employeeId = searchParams.get('employeeId')!;
    }

    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const claims = await reimbursementService.getClaims(filters);

    return NextResponse.json({ data: claims });
  } catch (error: any) {
    console.error('Get expense claims error:', error);
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

    if (!user.employeeId) {
      return NextResponse.json(
        { error: 'User tidak terhubung dengan karyawan' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = createClaimSchema.parse(body);

    const claim = await reimbursementService.createClaim({
      ...validated,
      employeeId: user.employeeId,
    });

    return NextResponse.json({ data: claim }, { status: 201 });
  } catch (error: any) {
    console.error('Create expense claim error:', error);
    
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
