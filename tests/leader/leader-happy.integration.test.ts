import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  db,
  users,
  employees,
  teams,
  leaderAssignments,
  employeeTeamAssignments,
  kpiProductionEntries,
  workLocations,
  shifts,
} from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { leaderService } from '@/services/leader/leader.service';

/**
 * Happy-path integration tests for LeaderService against a real DB. Seeds a
 * leader user/employee and a member employee, then builds the team + leader and
 * member assignments through the service itself (covering createTeam /
 * assignLeader / assignEmployee). Exercises the team/member reads and the
 * production-entry write. All seeded rows are cleaned up afterwards.
 */
describe('LeaderService happy paths (real DB, seeded team)', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const leaderUserId = `itest-leader-${suffix}`;
  const targetEmpId = `itest-member-${suffix}`;
  const locId = `itest-loc-${suffix}`;
  const shiftId = `itest-shift-${suffix}`;
  let teamId: string;

  beforeAll(async () => {
    // A complete leader profile requires an active location + shift.
    await db.insert(workLocations).values({
      id: locId, name: `itest loc ${suffix}`, address: 'Medan', latitude: 3.59, longitude: 98.67,
    });
    await db.insert(shifts).values({
      id: shiftId, name: `itest shift ${suffix}`, startTime: '08:00', endTime: '16:00', isActive: true,
    });

    await db.insert(users).values({
      id: leaderUserId, email: `${leaderUserId}@t.local`, username: leaderUserId,
      password: 'x', role: 'LEADER', isActive: true,
    });
    await db.insert(employees).values({
      id: leaderUserId, nip: `NIP-${leaderUserId}`, userId: leaderUserId,
      fullName: 'IT Leader', email: `${leaderUserId}@t.local`, status: 'ACTIVE', position: 'Leader',
      defaultLocationId: locId, defaultShiftId: shiftId,
    });
    await db.insert(users).values({
      id: targetEmpId, email: `${targetEmpId}@t.local`, username: targetEmpId,
      password: 'x', role: 'EMPLOYEE', isActive: true,
    });
    await db.insert(employees).values({
      id: targetEmpId, nip: `NIP-${targetEmpId}`, userId: targetEmpId,
      fullName: 'IT Member', email: `${targetEmpId}@t.local`, status: 'ACTIVE', position: 'Staff',
    });

    const team = await leaderService.createTeam('itest-actor', { name: `itest team ${suffix}` });
    teamId = team.id;
    await leaderService.assignLeader('itest-actor', leaderUserId, teamId);
    await leaderService.assignEmployee('itest-actor', targetEmpId, teamId);
  });

  afterAll(async () => {
    await db.delete(kpiProductionEntries).where(inArray(kpiProductionEntries.employeeId, [leaderUserId, targetEmpId]));
    if (teamId) {
      await db.delete(employeeTeamAssignments).where(eq(employeeTeamAssignments.teamId, teamId));
      await db.delete(leaderAssignments).where(eq(leaderAssignments.teamId, teamId));
      await db.delete(teams).where(eq(teams.id, teamId));
    }
    await db.delete(employees).where(inArray(employees.id, [leaderUserId, targetEmpId]));
    await db.delete(users).where(inArray(users.id, [leaderUserId, targetEmpId]));
    await db.delete(shifts).where(eq(shifts.id, shiftId));
    await db.delete(workLocations).where(eq(workLocations.id, locId));
  });

  it('getLeaderTeams: returns the assigned team', async () => {
    const teamsList = await leaderService.getLeaderTeams(leaderUserId);
    expect(teamsList.length).toBeGreaterThanOrEqual(1);
  });

  it('requireLeaderTeam: resolves for the assigned team', async () => {
    const outcome = await leaderService
      .requireLeaderTeam(leaderUserId, teamId)
      .then(() => 'ok')
      .catch(() => 'threw');
    expect(outcome).toBe('ok');
  });

  it('getTeamEmployeesForLeader: returns the team members', async () => {
    const members = await leaderService.getTeamEmployeesForLeader(leaderUserId);
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThanOrEqual(1);
  });

  it('getLeaderEmployeeId: returns the leader employee id', async () => {
    const empId = await leaderService.getLeaderEmployeeId(leaderUserId);
    expect(empId).toBe(leaderUserId);
  });

  it('createOrUpdateProductionEntry: records a KPI entry for a team member', async () => {
    const entry = await leaderService.createOrUpdateProductionEntry(leaderUserId, {
      employeeId: targetEmpId,
      quantity: 10,
    });
    expect(entry).toBeDefined();
    expect(Number(entry.quantity)).toBeCloseTo(10, 2);
  });

  it('listProductionEntriesForLeader: returns the entries for the leader team', async () => {
    const entries = await leaderService.listProductionEntriesForLeader(leaderUserId);
    expect(Array.isArray(entries)).toBe(true);
  });
});
