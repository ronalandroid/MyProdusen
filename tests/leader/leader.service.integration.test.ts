import { describe, it, expect } from 'vitest';
import { leaderService } from '@/services/leader/leader.service';

/**
 * Integration tests for LeaderService against a real DB. These exercise the
 * validation/guard branches and empty-result reads using non-existent ids, so
 * they need no seeding and write nothing — covering the access-control and
 * input-validation paths that protect the leader/KPI surface.
 */
describe('LeaderService integration (real DB, guard paths)', () => {
  const NONE = 'itest-nonexistent-id';

  it('getLeaderEmployeeProfile: rejects a user with no employee record', async () => {
    await expect(leaderService.getLeaderEmployeeProfile(NONE)).rejects.toThrow(/karyawan|hubungi superadmin/i);
  });

  it('createTeam: rejects an empty team name', async () => {
    await expect(
      leaderService.createTeam('itest-actor', { name: '   ' }),
    ).rejects.toThrow(/nama tim wajib/i);
  });

  it('listTeams: returns an array', async () => {
    const teams = await leaderService.listTeams();
    expect(Array.isArray(teams)).toBe(true);
  });

  it('assignLeader: rejects a target user that is not an active LEADER', async () => {
    await expect(
      leaderService.assignLeader('itest-actor', NONE, 'itest-team'),
    ).rejects.toThrow(/leader tidak aktif|belum berperan/i);
  });

  it('assignEmployee: rejects a non-existent / inactive employee', async () => {
    await expect(
      leaderService.assignEmployee('itest-actor', NONE, 'itest-team'),
    ).rejects.toThrow(/tidak ditemukan|tidak aktif/i);
  });

  it('requireLeaderTeam: rejects a leader not assigned to the team', async () => {
    await expect(
      leaderService.requireLeaderTeam(NONE, 'itest-team'),
    ).rejects.toThrow(/belum ditetapkan/i);
  });

  it('getLeaderTeams: returns an empty array for a leader with no assignments', async () => {
    const teams = await leaderService.getLeaderTeams(NONE);
    expect(Array.isArray(teams)).toBe(true);
    expect(teams).toHaveLength(0);
  });

  it('getTeamEmployeesForLeader: rejects a leader with no team assignments', async () => {
    await expect(
      leaderService.getTeamEmployeesForLeader(NONE),
    ).rejects.toThrow(/belum ditetapkan/i);
  });

  it('getOwnProductionEntries: rejects a user with no employee record', async () => {
    await expect(
      leaderService.getOwnProductionEntries(NONE),
    ).rejects.toThrow(/karyawan tidak ditemukan/i);
  });

  it('listProductionEntriesForLeader: rejects a leader with no team assignments', async () => {
    await expect(
      leaderService.listProductionEntriesForLeader(NONE),
    ).rejects.toThrow(/belum ditetapkan/i);
  });

  it('createOrUpdateProductionEntry: rejects a negative KPI quantity', async () => {
    await expect(
      leaderService.createOrUpdateProductionEntry(NONE, { employeeId: NONE, quantity: -5 }),
    ).rejects.toThrow(/angka 0 atau lebih|KPI wajib/i);
  });
});
