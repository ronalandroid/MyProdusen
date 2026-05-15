import { NextRequest, NextResponse } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR' && user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const overtimeRequest = await overtimeService.approveRequest(params.id, user.id);

    return NextResponse.json({ data: overtimeRequest });
  } catch (error: any) {
    console.error('Approve overtime error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
