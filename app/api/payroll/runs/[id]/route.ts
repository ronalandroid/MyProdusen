import { NextRequest, NextResponse } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';

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

    const run = await payrollService.getPayrollRunById(params.id);

    return NextResponse.json({ data: run });
  } catch (error: any) {
    console.error('Get payroll run error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}
