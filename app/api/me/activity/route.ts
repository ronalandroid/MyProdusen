import { NextRequest } from 'next/server';
import { auditService } from '@/features/audit/audit.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { humanizeAuditAction } from '@/lib/audit/humanize';

/**
 * The signed-in user's OWN activity log (kebijakan owner #32: "user lihat
 * log-nya sendiri; Superadmin lihat semua"). Hard-scoped to the caller's
 * userId — it never reads a userId query param, so no one can view another
 * person's trail here (the SUPERADMIN-wide view lives at /api/audit).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;

    const logs = await auditService.getLogs({ userId: user.userId, limit });

    // Return only presentation-safe fields (never oldValue/newValue payloads).
    const items = logs.map((log) => ({
      id: log.id,
      action: log.action,
      label: humanizeAuditAction(log.action, log.entity),
      entity: log.entity,
      createdAt: log.createdAt,
      ipAddress: log.ipAddress,
    }));

    return successResponse(items);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
