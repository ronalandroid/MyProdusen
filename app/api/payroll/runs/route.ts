import { NextRequest, NextResponse } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

const createRunSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const runs = await payrollService.getPayrollRuns();

    return NextResponse.json({ data: runs });
  } catch (error: any) {
    console.error('Get payroll runs error:', error);
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

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createRunSchema.parse(body);

    const run = await payrollService.createPayrollRun({
      ...validated,
      calculatedBy: user.id,
    });

    return NextResponse.json({ data: run }, { status: 201 });
  } catch (error: any) {
    console.error('Create payroll run error:', error);
    
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
