import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

/**
 * GET /api/sync/conflicts - Get all unresolved conflicts
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    
    // Return conflicts
    // In production, this would query actual conflicts from database
    return NextResponse.json({
      conflicts: [],
      total: 0
    });

  } catch (error) {
    console.error('Get conflicts error:', error);
    return NextResponse.json(
      { error: 'Failed to get conflicts' },
      { status: 500 }
    );
  }
}
