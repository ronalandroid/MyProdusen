import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { runRetentionSweep } from '@/lib/retention/retention-service';

function secretMatches(request: NextRequest): boolean {
  const configured = process.env.RETENTION_CRON_SECRET;
  if (!configured) return false;
  const provided = request.headers.get('x-retention-secret') ?? '';
  // Length-guarded equality (secret is high-entropy; avoids trivial mismatch leak).
  return provided.length === configured.length && provided === configured;
}

/**
 * Runs the data-retention sweep (kebijakan owner #30). Two callers:
 *   - The monthly GitHub Action cron, authenticated by the shared
 *     `x-retention-secret` header (RETENTION_CRON_SECRET).
 *   - A Superadmin (manual trigger / dry-run).
 * Defaults to dryRun=true — a destructive real sweep must be requested
 * explicitly with { "dryRun": false }.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, RATE_LIMITS.API_STRICT, 'retention:sweep');
    if (rl.limited) return errorResponse('Terlalu banyak permintaan retensi. Coba lagi nanti.', 429);

    const viaSecret = secretMatches(request);
    let actorId = 'retention-cron';

    if (!viaSecret) {
      const user = await requireAuth(request);
      if (user.role !== 'SUPERADMIN') {
        return forbiddenResponse('Hanya Superadmin atau cron terotorisasi yang dapat menjalankan retensi');
      }
      actorId = user.userId;
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false; // default TRUE for safety
    const batchLimit = typeof body?.batchLimit === 'number' ? body.batchLimit : undefined;

    const result = await runRetentionSweep({ dryRun, batchLimit });

    if (!dryRun) {
      await logAudit(actorId, 'RETENTION_SWEEP', 'DataRetention', undefined, undefined, result, request);
    }

    return successResponse(
      result,
      dryRun
        ? `Simulasi retensi: ${result.selfiesPurged} selfie & ${result.auditLogsDeleted} log audit akan dibersihkan.`
        : `Retensi selesai: ${result.selfiesPurged} selfie dipurge, ${result.filesDeleted} file dihapus, ${result.auditLogsDeleted} log audit dihapus.`,
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') return forbiddenResponse('Autentikasi retensi gagal');
    return handleApiError(error);
  }
}
