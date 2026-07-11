/**
 * Glue between successful check-in/check-out responses and the existing
 * AttendanceException workflow that drives admin geo-review.
 *
 * - When `validation.decision === 'pending'` we register an OUTSIDE_GEOFENCE
 *   exception so admins see the entry on the existing review screen.
 * - We notify Superadmin users so the page does not need to be
 *   polled.
 * - Every branch writes a structured audit log entry so the original GPS
 *   evidence is preserved.
 */

import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, notifications, users } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { attendanceExceptionService } from '@/services/attendance/attendance-exception.service';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import type { GpsValidationResult } from '@/lib/attendance/gps-validation';
import type { JwtPayload } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export type GpsAuditAction =
  | 'CHECK_IN_GPS_VALID'
  | 'CHECK_IN_GPS_PENDING_REVIEW'
  | 'CHECK_IN_GPS_REJECTED'
  | 'CHECK_OUT_GPS_VALID'
  | 'CHECK_OUT_GPS_PENDING_REVIEW'
  | 'CHECK_OUT_GPS_REJECTED';

interface AfterAttendanceArgs {
  request: NextRequest;
  user: JwtPayload;
  employeeId: string;
  attendanceId: string;
  type: 'check-in' | 'check-out';
  validation: GpsValidationResult;
  /** The employee's written justification for attending outside the radius. */
  manualReason?: string;
}

/**
 * Run after a successful insert/update. Decides whether to create an
 * exception, alert admins, and writes the audit row.
 */
export async function recordGeoOutcome(args: AfterAttendanceArgs) {
  const { request, user, employeeId, attendanceId, type, validation } = args;
  const employeeReason = args.manualReason?.trim();
  // Store the employee's own words first, keeping the system distance detail
  // for context; fall back to the system message if they gave none.
  const reviewReason = employeeReason
    ? `${employeeReason} — ${validation.decision === 'pending' ? validation.reason : ''}`.trim().replace(/—\s*$/, '').trim()
    : validation.decision === 'pending'
      ? validation.reason
      : '';

  const auditAction: GpsAuditAction =
    type === 'check-in'
      ? validation.decision === 'pending'
        ? 'CHECK_IN_GPS_PENDING_REVIEW'
        : 'CHECK_IN_GPS_VALID'
      : validation.decision === 'pending'
        ? 'CHECK_OUT_GPS_PENDING_REVIEW'
        : 'CHECK_OUT_GPS_VALID';

  await logAudit(
    user.userId,
    auditAction,
    'Attendance',
    attendanceId,
    undefined,
    {
      type,
      employeeId,
      decision: validation.decision,
      geoStatus: validation.geoStatus,
      distanceMeters: validation.distanceMeters,
      metadata: validation.metadata,
    },
    request,
  );

  if (validation.decision === 'pending') {
    await attendanceExceptionService
      .createException({
        attendanceId,
        employeeId,
        type: 'OUTSIDE_GEOFENCE',
        reason: reviewReason || validation.reason,
        requestedBy: user.userId,
      })
      .catch(() => {
        // Exception creation is best-effort; the audit log already captured
        // everything needed for forensic review.
      });

    await notifyAdminsForPendingGeo({
      attendanceId,
      employeeId,
      reason: reviewReason || validation.reason,
    }).catch(() => {
      // Notifications must not block the attendance response.
    });

    // Realtime: push a live event to every Superadmin so an outside-radius
    // attendance shows up on their screen the instant it happens, no refresh.
    await publishRealtimeEvent(
      createRealtimeEvent({
        type: 'dashboard.updated',
        scope: 'role',
        target: 'SUPERADMIN',
        payload: {
          source: 'attendance.geo-review',
          attendanceId,
          employeeId,
          attendanceType: type,
          distanceMeters: validation.distanceMeters,
          reason: reviewReason || validation.reason,
        },
      }),
    ).catch(() => undefined);
  }
}

/**
 * Audit an outright rejection (no row was inserted/updated).
 */
export async function recordGeoRejection(args: {
  request: NextRequest;
  user: JwtPayload | null;
  employeeId: string | null;
  type: 'check-in' | 'check-out';
  validation: Extract<GpsValidationResult, { decision: 'reject' }>;
}) {
  const { request, user, employeeId, type, validation } = args;
  if (!user) return;
  const auditAction: GpsAuditAction =
    type === 'check-in' ? 'CHECK_IN_GPS_REJECTED' : 'CHECK_OUT_GPS_REJECTED';

  await logAudit(
    user.userId,
    auditAction,
    'Attendance',
    employeeId ?? undefined,
    undefined,
    {
      type,
      employeeId,
      decision: validation.decision,
      geoStatus: validation.geoStatus,
      reason: validation.reason,
      errorCode: validation.errorCode,
      metadata: validation.metadata,
    },
    request,
  );
}

async function notifyAdminsForPendingGeo(payload: {
  attendanceId: string;
  employeeId: string;
  reason: string;
}) {
  const adminUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isActive, true));

  // Filter in JS (lightweight; admin/superadmin user counts are small).
  const targets = adminUsers.filter(() => true);
  if (!targets.length) return;

  // Only notify SUPERADMIN roles. Re-query with role filter.
  const roleTargets = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.isActive, true));

  const filtered = roleTargets.filter((row) => row.role === 'SUPERADMIN' );
  if (!filtered.length) return;

  await db.insert(notifications).values(
    filtered.map((row) => ({
      id: uuidv4(),
      userId: row.id,
      title: 'Absensi pending review geo-fence',
      message: payload.reason,
      type: 'ATTENDANCE_GEO_REVIEW',
    })),
  );
}
