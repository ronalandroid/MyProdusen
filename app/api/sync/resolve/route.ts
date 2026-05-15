import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

/**
 * POST /api/sync/resolve - Manually resolve a conflict
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    
    const body = await req.json();
    const { conflictId, resolution, data } = body;

    if (!conflictId || !resolution) {
      return NextResponse.json(
        { error: 'conflictId and resolution are required' },
        { status: 400 }
      );
    }

    if (!['client', 'server', 'manual'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution type' },
        { status: 400 }
      );
    }

    // In production, this would update the conflict in database
    // and retry the sync operation with resolved data
    
    return NextResponse.json({
      success: true,
      conflictId,
      resolution,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Resolve conflict error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}
