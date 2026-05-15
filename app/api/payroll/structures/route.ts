import { NextRequest, NextResponse } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

const createStructureSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  baseSalary: z.number().min(0, 'Gaji pokok harus positif'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPERADMIN and ADMIN_HR can view payroll structures
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const structures = await payrollService.getStructures(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return NextResponse.json({ data: structures });
  } catch (error: any) {
    console.error('Get payroll structures error:', error);
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

    // Only SUPERADMIN and ADMIN_HR can create payroll structures
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createStructureSchema.parse(body);

    const structure = await payrollService.createStructure(validated);

    return NextResponse.json({ data: structure }, { status: 201 });
  } catch (error: any) {
    console.error('Create payroll structure error:', error);
    
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
