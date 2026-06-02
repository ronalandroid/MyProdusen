import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, employees, employeeTeamAssignments, kpiProductionEntries, leaderAssignments, teams, users } from '@/lib/db';
import { AppError } from '@/lib/core/app-error';
import { logAudit } from '@/lib/audit';

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function assertIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
    throw new AppError('KPI_DATE_INVALID', 'Tanggal KPI tidak valid', 422);
  }
}

export class LeaderService {
  async getLeaderEmployeeProfile(userId: string) {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
    if (!employee) throw new AppError('LEADER_PROFILE_INCOMPLETE', 'Anda belum memiliki data karyawan/lokasi kerja/shift. Hubungi Superadmin.', 403);
    if (employee.status !== 'ACTIVE') throw new AppError('USER_NOT_ACTIVE', 'Karyawan tidak aktif. Hubungi Superadmin.', 403);
    if (!employee.defaultLocationId) throw new AppError('LOCATION_NOT_ASSIGNED', 'Anda belum memiliki data karyawan/lokasi kerja/shift. Hubungi Superadmin.', 403);
    if (!employee.defaultShiftId) throw new AppError('SHIFT_NOT_ASSIGNED', 'Anda belum memiliki data karyawan/lokasi kerja/shift. Hubungi Superadmin.', 403);
    return employee;
  }

  async createTeam(actorUserId: string, data: { name: string; type?: string; description?: string }) {
    if (!data.name?.trim()) throw new AppError('VALIDATION_ERROR', 'Nama tim wajib diisi', 422);
    const name = data.name.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [team] = await db.insert(teams).values({ id: id('team'), name, slug, type: data.type?.trim() || null, description: data.description?.trim() || null, createdBy: actorUserId }).returning();
    return team;
  }

  async listTeams() {
    return db.select().from(teams).orderBy(asc(teams.name));
  }

  async assignLeader(actorUserId: string, leaderUserId: string, teamId: string) {
    const [leader] = await db.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, leaderUserId)).limit(1);
    if (!leader || leader.role !== 'LEADER' || !leader.isActive) throw new AppError('LEADER_PROFILE_INCOMPLETE', 'User Leader tidak aktif atau belum berperan Leader', 422);
    await this.getLeaderEmployeeProfile(leaderUserId);
    const [existing] = await db.select().from(leaderAssignments).where(and(eq(leaderAssignments.leaderUserId, leaderUserId), eq(leaderAssignments.teamId, teamId))).limit(1);
    if (existing) {
      const [assignment] = await db.update(leaderAssignments).set({ active: true, updatedAt: new Date(), createdBy: actorUserId }).where(eq(leaderAssignments.id, existing.id)).returning();
      await logAudit(actorUserId, 'LEADER_ASSIGNMENT_UPDATE', 'LeaderAssignment', assignment.id, existing, assignment);
      return assignment;
    }
    const [assignment] = await db.insert(leaderAssignments).values({ id: id('leader_assignment'), leaderUserId, teamId, createdBy: actorUserId }).returning();
    await logAudit(actorUserId, 'LEADER_ASSIGNMENT_CREATE', 'LeaderAssignment', assignment.id, undefined, assignment);
    return assignment;
  }

  async assignEmployee(actorUserId: string, employeeId: string, teamId: string, positionId?: string | null) {
    const [employee] = await db.select({ id: employees.id, status: employees.status }).from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (!employee || employee.status !== 'ACTIVE') throw new AppError('EMPLOYEE_NOT_FOUND', 'Karyawan tidak ditemukan atau tidak aktif', 404);
    await db.update(employeeTeamAssignments).set({ active: false, updatedAt: new Date(), assignedBy: actorUserId }).where(and(eq(employeeTeamAssignments.employeeId, employeeId), eq(employeeTeamAssignments.active, true)));
    const [existing] = await db.select().from(employeeTeamAssignments).where(and(eq(employeeTeamAssignments.employeeId, employeeId), eq(employeeTeamAssignments.teamId, teamId))).limit(1);
    if (existing) {
      const [assignment] = await db.update(employeeTeamAssignments).set({ active: true, updatedAt: new Date(), assignedBy: actorUserId, positionId: positionId || null }).where(eq(employeeTeamAssignments.id, existing.id)).returning();
      await logAudit(actorUserId, 'EMPLOYEE_TEAM_ASSIGNMENT_UPDATE', 'EmployeeTeamAssignment', assignment.id, existing, assignment);
      return assignment;
    }
    const [assignment] = await db.insert(employeeTeamAssignments).values({ id: id('employee_team'), employeeId, teamId, positionId: positionId || null, assignedBy: actorUserId }).returning();
    await logAudit(actorUserId, 'EMPLOYEE_TEAM_ASSIGNMENT_CREATE', 'EmployeeTeamAssignment', assignment.id, undefined, assignment);
    return assignment;
  }

  async deactivateLeaderAssignments(leaderUserId: string) {
    await db.update(leaderAssignments).set({ active: false, updatedAt: new Date() }).where(and(eq(leaderAssignments.leaderUserId, leaderUserId), eq(leaderAssignments.active, true)));
  }

  async getLeaderTeams(leaderUserId: string) {
    return db.select({ id: teams.id, name: teams.name, type: teams.type, description: teams.description }).from(leaderAssignments).innerJoin(teams, eq(teams.id, leaderAssignments.teamId)).where(and(eq(leaderAssignments.leaderUserId, leaderUserId), eq(leaderAssignments.active, true), eq(teams.active, true))).orderBy(asc(teams.name));
  }

  async requireLeaderTeam(leaderUserId: string, teamId: string) {
    const [assignment] = await db.select({ id: leaderAssignments.id }).from(leaderAssignments).where(and(eq(leaderAssignments.leaderUserId, leaderUserId), eq(leaderAssignments.teamId, teamId), eq(leaderAssignments.active, true))).limit(1);
    if (!assignment) throw new AppError('TEAM_NOT_ASSIGNED', 'Anda belum ditetapkan ke tim ini. Hubungi Superadmin.', 403);
  }

  async getTeamEmployeesForLeader(leaderUserId: string, teamId?: string) {
    const leaderTeams = await this.getLeaderTeams(leaderUserId);
    if (leaderTeams.length === 0) throw new AppError('TEAM_NOT_ASSIGNED', 'Anda belum ditetapkan ke tim. Hubungi Superadmin.', 403);
    const teamIds = teamId ? [teamId] : leaderTeams.map((team) => team.id);
    if (teamId) await this.requireLeaderTeam(leaderUserId, teamId);
    return db.select({ id: employees.id, nip: employees.nip, fullName: employees.fullName, division: employees.division, position: employees.position, status: employees.status, teamId: employeeTeamAssignments.teamId, teamName: teams.name }).from(employeeTeamAssignments).innerJoin(employees, eq(employees.id, employeeTeamAssignments.employeeId)).innerJoin(teams, eq(teams.id, employeeTeamAssignments.teamId)).where(and(inArray(employeeTeamAssignments.teamId, teamIds), eq(employeeTeamAssignments.active, true), eq(employees.status, 'ACTIVE'))).orderBy(asc(employees.fullName));
  }

  async createOrUpdateProductionEntry(leaderUserId: string, data: { employeeId: string; teamId?: string | null; date?: string; metricType?: string; quantity?: number; packs?: number; unit?: string; note?: string }) {
    const entryDate = data.date || todayIso();
    assertIsoDate(entryDate);
    const quantity = Number(data.quantity ?? data.packs);
    if (!Number.isFinite(quantity) || quantity < 0) throw new AppError('KPI_QUANTITY_INVALID', 'Jumlah KPI wajib berupa angka 0 atau lebih', 422);

    const [targetEmployee] = await db
      .select({ id: employees.id, userId: employees.userId, status: employees.status })
      .from(employees)
      .where(sql`${employees.id} = ${data.employeeId} OR ${employees.userId} = ${data.employeeId}`)
      .limit(1);
    if (!targetEmployee || targetEmployee.status !== 'ACTIVE') throw new AppError('EMPLOYEE_NOT_IN_LEADER_TEAM', 'Karyawan tidak berada dalam tim Anda', 403);

    const [leaderEmployee] = await db.select({ id: employees.id }).from(employees).where(eq(employees.userId, leaderUserId)).limit(1);
    if (process.env.ALLOW_LEADER_SELF_KPI_INPUT !== 'true' && leaderEmployee?.id === targetEmployee.id) throw new AppError('ACCESS_DENIED', 'Leader tidak dapat menginput KPI sendiri', 403);

    const requestedTeamId = data.teamId?.trim() || null;
    const assignedRows = await db
      .select({ teamId: employeeTeamAssignments.teamId })
      .from(employeeTeamAssignments)
      .where(and(eq(employeeTeamAssignments.employeeId, targetEmployee.id), eq(employeeTeamAssignments.active, true)));
    const candidateTeamIds = requestedTeamId ? [requestedTeamId] : assignedRows.map((row) => row.teamId);
    if (candidateTeamIds.length === 0) throw new AppError('EMPLOYEE_NOT_IN_LEADER_TEAM', 'Karyawan tidak berada dalam tim Anda', 403);

    let canonicalTeamId: string | null = null;
    for (const teamId of candidateTeamIds) {
      const isAssignedToTeam = assignedRows.some((row) => row.teamId === teamId);
      if (!isAssignedToTeam) continue;
      try {
        await this.requireLeaderTeam(leaderUserId, teamId);
        canonicalTeamId = teamId;
        break;
      } catch (error: any) {
        if (error?.status !== 403) throw error;
      }
    }
    if (!canonicalTeamId) throw new AppError('EMPLOYEE_NOT_IN_LEADER_TEAM', 'Karyawan tidak berada dalam tim Anda', 403);

    const metricType = data.metricType?.trim() || 'production_count';
    const [existing] = await db.select().from(kpiProductionEntries).where(and(eq(kpiProductionEntries.employeeId, targetEmployee.id), eq(kpiProductionEntries.teamId, canonicalTeamId), eq(kpiProductionEntries.date, entryDate), eq(kpiProductionEntries.metricType, metricType))).limit(1);
    if (existing) {
      const [entry] = await db.update(kpiProductionEntries).set({ quantity: quantity.toFixed(2), unit: data.unit?.trim() || 'pcs', note: data.note?.trim() || null, updatedBy: leaderUserId, updatedAt: new Date() }).where(eq(kpiProductionEntries.id, existing.id)).returning();
      return entry;
    }
    const [entry] = await db.insert(kpiProductionEntries).values({ id: id('kpi_prod'), employeeId: targetEmployee.id, teamId: canonicalTeamId, leaderUserId, date: entryDate, metricType, quantity: quantity.toFixed(2), unit: data.unit?.trim() || 'pcs', note: data.note?.trim() || null, createdBy: leaderUserId, updatedBy: leaderUserId }).returning();
    return entry;
  }

  async listProductionEntriesForLeader(leaderUserId: string, teamId?: string, date = todayIso()) {
    assertIsoDate(date);
    const teamEmployees = await this.getTeamEmployeesForLeader(leaderUserId, teamId);
    const employeeIds = teamEmployees.map((employee) => employee.id);
    const teamIds = Array.from(new Set(teamEmployees.map((employee) => employee.teamId)));
    if (employeeIds.length === 0 || teamIds.length === 0) return [];
    return db.select({ id: kpiProductionEntries.id, employeeId: kpiProductionEntries.employeeId, teamId: kpiProductionEntries.teamId, date: kpiProductionEntries.date, metricType: kpiProductionEntries.metricType, quantity: kpiProductionEntries.quantity, unit: kpiProductionEntries.unit, note: kpiProductionEntries.note, employeeName: employees.fullName, employeeNip: employees.nip }).from(kpiProductionEntries).innerJoin(employees, eq(employees.id, kpiProductionEntries.employeeId)).where(and(inArray(kpiProductionEntries.employeeId, employeeIds), inArray(kpiProductionEntries.teamId, teamIds), eq(kpiProductionEntries.date, date))).orderBy(asc(employees.fullName));
  }

  async getOwnProductionEntries(userId: string) {
    const [employee] = await db.select({ id: employees.id }).from(employees).where(eq(employees.userId, userId)).limit(1);
    if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'Data karyawan tidak ditemukan', 404);
    return db.select({ id: kpiProductionEntries.id, date: kpiProductionEntries.date, metricType: kpiProductionEntries.metricType, quantity: kpiProductionEntries.quantity, unit: kpiProductionEntries.unit, note: kpiProductionEntries.note, teamName: teams.name, source: sql<string>`'Diinput oleh Leader'` }).from(kpiProductionEntries).innerJoin(teams, eq(teams.id, kpiProductionEntries.teamId)).where(eq(kpiProductionEntries.employeeId, employee.id)).orderBy(sql`${kpiProductionEntries.date} desc`).limit(60);
  }
}

export const leaderService = new LeaderService();
