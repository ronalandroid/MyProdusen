import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from '@/utils/response';
import { loadAttendanceSelfie } from '@/lib/attendance/selfie-access';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> },
) {
  try {
    const viewer = await requireAuth(request);
    const { attendanceId } = await params;

    const result = await loadAttendanceSelfie(request, viewer, attendanceId, 'check-out');

    if (!result.ok) {
      if (result.status === 403) return forbiddenResponse(result.error);
      if (result.status === 404) return notFoundResponse(result.error);
      return errorResponse(result.error, result.status);
    }

    return new NextResponse(new Uint8Array(result.data.buffer), {
      headers: {
        'Content-Type': result.data.mimeType,
        'Content-Length': String(result.data.size),
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename="attendance-${attendanceId}-checkout"`,
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    if (error?.code === 'ENOENT') return notFoundResponse('Selfie tidak ditemukan');
    return errorResponse('Gagal mengambil selfie absensi', 500);
  }
}
