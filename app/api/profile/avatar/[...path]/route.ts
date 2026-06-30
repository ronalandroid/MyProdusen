import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { eq } from 'drizzle-orm';
import { db, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { resolveUploadStoragePath } from '@/lib/upload';
import { parseImageWidth, resizeImageToWebp } from '@/lib/images/resize-image';
import { logAudit } from '@/lib/audit';

const AVATAR_ROUTE_PREFIX = '/api/profile/avatar/';
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const SAFE_FILENAME = /^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i;
const SAFE_DIR_SEGMENT = /^[A-Za-z0-9_-]+$/;

function buildAvatarKey(segments: string[]) {
  if (!segments.length) return null;
  const filename = segments[segments.length - 1];
  if (!SAFE_FILENAME.test(filename)) return null;
  for (let index = 0; index < segments.length - 1; index += 1) {
    if (!SAFE_DIR_SEGMENT.test(segments[index])) return null;
  }
  return segments.join('/');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const user = await requireAuth(request);
    const resolvedParams = await params;
    const key = buildAvatarKey((resolvedParams.path || []).filter(Boolean));
    if (!key) return notFoundResponse('Avatar tidak ditemukan');

    const avatarUrl = `${AVATAR_ROUTE_PREFIX}${key}`;
    const [employee] = await db.select().from(employees).where(eq(employees.profilePhoto, avatarUrl)).limit(1);
    if (!employee) return notFoundResponse('Avatar tidak ditemukan');

    const isOwner = employee.userId === user.userId;
    if (!isOwner && user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Anda tidak memiliki akses melihat avatar karyawan ini');
    }

    const filePath = resolveUploadStoragePath(key);
    if (!filePath) return notFoundResponse('Avatar tidak ditemukan');
    const stats = await stat(filePath).catch(() => null);
    if (!stats?.isFile()) return notFoundResponse('Avatar tidak ditemukan');
    const file = await readFile(filePath);
    const extension = (path.extname(filePath).slice(1) || 'webp').toLowerCase();

    if (!isOwner) {
      await logAudit(user.userId, 'PROFILE_AVATAR_VIEW', 'Employee', employee.id, undefined, { employeeId: employee.id, sizeBytes: stats.size }, request);
    }

    // Optional on-the-fly thumbnail (auth/authz already enforced above). The
    // ?w value is snapped to an allowlist; any resize error falls back to the
    // original file so the image never breaks.
    const width = parseImageWidth(request.nextUrl.searchParams);
    let body: Buffer = file;
    let contentType = MIME_BY_EXTENSION[extension] || 'application/octet-stream';
    if (width !== null) {
      try {
        body = await resizeImageToWebp(file, width);
        contentType = 'image/webp';
      } catch {
        body = file;
      }
    }

    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, private',
        'Content-Length': String(body.length),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    if (error?.code === 'ENOENT') return notFoundResponse('Avatar tidak ditemukan');
    return errorResponse('Gagal mengambil avatar', 500);
  }
}
