import { NextRequest, NextResponse } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const structure = await payrollService.getStructureById(params.id);

    return NextResponse.json({ data: structure });
  } catch (error: any) {
    console.error('Get payroll structure error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateStructureSchema.parse(body);

    const structure = await payrollService.updateStructure(params.id, validated);

    return NextResponse.json({ data: structure });
  } catch (error: any) {
    console.error('Update payroll structure error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await payrollService.deleteStructure(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete payroll structure error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
