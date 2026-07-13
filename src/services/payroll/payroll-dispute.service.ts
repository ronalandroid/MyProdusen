import { and, desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db, payrollDisputes, payrollItems, payrollRuns, employees, users } from '@/lib/db';
import { BusinessError } from '@/lib/core/business-error';
import { notifyUser } from '@/lib/notifications/dispatch';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

export type PayrollDisputeStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

const MIN_REASON_LENGTH = 10;
const MIN_REVIEW_NOTE_LENGTH = 5;

export class PayrollDisputeService {
  /**
   * Karyawan mengadukan ketidaksesuaian gaji atas payslip miliknya. Menolak
   * jika payslip bukan milik pelapor atau masih ada aduan yang menunggu review
   * untuk payslip yang sama (hindari antrean ganda).
   */
  async createDispute(data: {
    payrollItemId: string;
    employeeId: string;
    reason: string;
    requestedByUserId: string;
  }) {
    const reason = data.reason?.trim() ?? '';
    if (reason.length < MIN_REASON_LENGTH) {
      throw new BusinessError(`Alasan aduan minimal ${MIN_REASON_LENGTH} karakter — jelaskan bagian gaji yang menurut Anda keliru`);
    }

    const [item] = await db
      .select({ id: payrollItems.id, employeeId: payrollItems.employeeId, runId: payrollItems.runId })
      .from(payrollItems)
      .where(eq(payrollItems.id, data.payrollItemId))
      .limit(1);

    if (!item) {
      throw new BusinessError('Slip gaji tidak ditemukan');
    }
    if (item.employeeId !== data.employeeId) {
      throw new BusinessError('Anda hanya dapat mengadukan slip gaji milik sendiri');
    }

    const [openDispute] = await db
      .select({ id: payrollDisputes.id })
      .from(payrollDisputes)
      .where(and(
        eq(payrollDisputes.payrollItemId, data.payrollItemId),
        eq(payrollDisputes.status, 'PENDING'),
      ))
      .limit(1);

    if (openDispute) {
      throw new BusinessError('Aduan untuk slip gaji ini sedang ditinjau. Tunggu keputusan Superadmin dulu.');
    }

    const [run] = await db
      .select({ period: payrollRuns.period })
      .from(payrollRuns)
      .where(eq(payrollRuns.id, item.runId))
      .limit(1);

    const [created] = await db
      .insert(payrollDisputes)
      .values({
        id: uuidv4(),
        payrollItemId: data.payrollItemId,
        employeeId: data.employeeId,
        period: run?.period ?? 'unknown',
        reason,
        status: 'PENDING',
      })
      .returning();

    await this.notifySuperadmins(data.employeeId, created.period, reason);

    return created;
  }

  async listDisputes(filters: {
    status?: PayrollDisputeStatus;
    viewerRole: string;
    viewerEmployeeId?: string;
  }) {
    const conditions = [];
    if (filters.status) {
      conditions.push(eq(payrollDisputes.status, filters.status));
    }
    // Employees only ever see their own disputes, whatever they ask for.
    if (filters.viewerRole === 'EMPLOYEE' || filters.viewerRole === 'LEADER') {
      if (!filters.viewerEmployeeId) return [];
      conditions.push(eq(payrollDisputes.employeeId, filters.viewerEmployeeId));
    }

    const query = db
      .select({
        dispute: payrollDisputes,
        employee: { id: employees.id, fullName: employees.fullName, nip: employees.nip },
      })
      .from(payrollDisputes)
      .leftJoin(employees, eq(payrollDisputes.employeeId, employees.id))
      .orderBy(desc(payrollDisputes.createdAt));

    return conditions.length > 0 ? query.where(and(...conditions)) : query;
  }

  /** Superadmin cross-check: RESOLVED (setuju) atau REJECTED (tolak). */
  async reviewDispute(data: {
    id: string;
    reviewerUserId: string;
    status: 'RESOLVED' | 'REJECTED';
    reviewNote: string;
  }) {
    const reviewNote = data.reviewNote?.trim() ?? '';
    if (reviewNote.length < MIN_REVIEW_NOTE_LENGTH) {
      throw new BusinessError(`Catatan keputusan minimal ${MIN_REVIEW_NOTE_LENGTH} karakter`);
    }

    const [existing] = await db
      .select()
      .from(payrollDisputes)
      .where(eq(payrollDisputes.id, data.id))
      .limit(1);

    if (!existing) {
      throw new BusinessError('Aduan gaji tidak ditemukan');
    }
    if (existing.status !== 'PENDING') {
      throw new BusinessError('Aduan gaji ini sudah diproses');
    }

    const [updated] = await db
      .update(payrollDisputes)
      .set({
        status: data.status,
        reviewNote,
        reviewedBy: data.reviewerUserId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollDisputes.id, data.id))
      .returning();

    const title = data.status === 'RESOLVED' ? 'Aduan gaji Anda disetujui' : 'Aduan gaji Anda ditolak';
    await notifyUser({
      employeeId: existing.employeeId,
      title,
      message: `Slip gaji ${existing.period}: ${reviewNote}`,
      type: 'PAYROLL_DISPUTE',
    }).catch(() => undefined);

    return updated;
  }

  private async notifySuperadmins(employeeId: string, period: string, reason: string) {
    const [employee] = await db
      .select({ fullName: employees.fullName })
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    const superadmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'SUPERADMIN'), eq(users.isActive, true)));

    await Promise.all(
      superadmins.map((admin) =>
        notifyUser({
          userId: admin.id,
          title: 'Aduan ketidaksesuaian gaji',
          message: `${employee?.fullName ?? 'Karyawan'} (slip ${period}): ${reason}`,
          type: 'PAYROLL_DISPUTE',
        }).catch(() => undefined),
      ),
    );

    await publishRealtimeEvent(createRealtimeEvent({
      type: 'dashboard.updated',
      scope: 'role',
      target: 'SUPERADMIN',
      payload: { source: 'payroll.dispute', period },
    })).catch(() => undefined);
  }
}

export const payrollDisputeService = new PayrollDisputeService();
