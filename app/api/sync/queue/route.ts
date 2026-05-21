import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

/**
 * POST /api/sync/queue - Batch sync endpoint
 * Accepts multiple sync operations and processes them
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    const body = await req.json();
    const { operations } = body;

    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations must be an array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const op of operations) {
      try {
        const result = await processSyncOperation(op);
        results.push({
          clientId: op.clientId,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          clientId: op.clientId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      results,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Batch sync error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch sync' },
      { status: 500 }
    );
  }
}

/**
 * Process a single sync operation
 */
async function processSyncOperation(operation: any) {
  const { entity } = operation;

  switch (entity) {
    case 'attendance':
    case 'leave':
      throw new Error('Offline sync queue belum aktif di production. Gunakan halaman fitur online agar data tersimpan langsung ke server.');

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}
