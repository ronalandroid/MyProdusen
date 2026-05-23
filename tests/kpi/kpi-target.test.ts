import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, kpiMetrics, kpiTargets, employees, employeeTeamAssignments, teams, users } from '@/lib/db';
import { kpiService } from '@/services/kpi/kpi.service';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

describe('KPI Targets and Active Target Resolution Hierarchy', () => {
  let employeeId: string;
  let leaderId: string;
  let teamId: string;
  let metricId: string;

  beforeEach(async () => {
    // Generate unique IDs for testing
    employeeId = `test_emp_${Date.now()}`;
    leaderId = `test_ldr_${Date.now()}`;
    teamId = `test_team_${Date.now()}`;
    metricId = `test_met_${Date.now()}`;

    // Clean up if any leftovers exist
    await db.delete(kpiTargets).where(eq(kpiTargets.metricId, metricId));
    await db.delete(kpiMetrics).where(eq(kpiMetrics.id, metricId));

    // Seed master data
    await db.insert(kpiMetrics).values({
      id: metricId,
      name: `Cetak Dimsum ${metricId}`,
      unit: 'pack',
      active: true,
    });

    // Create a mock user + employee
    await db.insert(users).values({
      id: employeeId,
      email: `${employeeId}@myprodusen.local`,
      username: employeeId,
      password: 'password',
      role: 'EMPLOYEE',
      isActive: true,
    });

    await db.insert(employees).values({
      id: employeeId,
      nip: `MPD-${employeeId.slice(0, 10)}`,
      userId: employeeId,
      fullName: 'Test Employee Target',
      email: `${employeeId}@myprodusen.local`,
      status: 'ACTIVE',
      position: 'Staff Cetak',
    });

    // Create a mock team & assignment
    await db.insert(teams).values({
      id: teamId,
      name: `Team Cetak ${teamId}`,
      active: true,
    });

    await db.insert(employeeTeamAssignments).values({
      id: `assignment_${teamId}`,
      employeeId,
      teamId,
      active: true,
    });
  });

  afterEach(async () => {
    // Clean up
    await db.delete(kpiTargets).where(eq(kpiTargets.metricId, metricId));
    await db.delete(kpiMetrics).where(eq(kpiMetrics.id, metricId));
    await db.delete(employeeTeamAssignments).where(eq(employeeTeamAssignments.employeeId, employeeId));
    await db.delete(teams).where(eq(teams.id, teamId));
    await db.delete(employees).where(eq(employees.id, employeeId));
    await db.delete(users).where(eq(users.id, employeeId));
  });

  it('H4 Fallback: Resolves to COMPANY-wide global target if no other target matches', async () => {
    const companyTargetId = uuidv4();
    await db.insert(kpiTargets).values({
      id: companyTargetId,
      metricId,
      scopeType: 'COMPANY',
      scopeId: null,
      periodType: 'WEEKLY',
      targetQuantity: 100,
      active: true,
    });

    const resolved = await kpiService.resolveActiveTarget(employeeId, metricId);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe(companyTargetId);
    expect(resolved?.targetQuantity).toBe(100);
  });

  it('H3 Priority: Resolves to TEAM target over COMPANY target', async () => {
    const companyTargetId = uuidv4();
    const teamTargetId = uuidv4();

    await db.insert(kpiTargets).values({
      id: companyTargetId,
      metricId,
      scopeType: 'COMPANY',
      scopeId: null,
      periodType: 'WEEKLY',
      targetQuantity: 100,
      active: true,
    });

    await db.insert(kpiTargets).values({
      id: teamTargetId,
      metricId,
      scopeType: 'TEAM',
      scopeId: teamId,
      periodType: 'WEEKLY',
      targetQuantity: 200,
      active: true,
    });

    const resolved = await kpiService.resolveActiveTarget(employeeId, metricId);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe(teamTargetId);
    expect(resolved?.targetQuantity).toBe(200);
  });

  it('H2 Priority: Resolves to POSITION target over TEAM target', async () => {
    const teamTargetId = uuidv4();
    const positionTargetId = uuidv4();

    await db.insert(kpiTargets).values({
      id: teamTargetId,
      metricId,
      scopeType: 'TEAM',
      scopeId: teamId,
      periodType: 'WEEKLY',
      targetQuantity: 200,
      active: true,
    });

    await db.insert(kpiTargets).values({
      id: positionTargetId,
      metricId,
      scopeType: 'POSITION',
      scopeId: 'Staff Cetak',
      periodType: 'WEEKLY',
      targetQuantity: 300,
      active: true,
    });

    const resolved = await kpiService.resolveActiveTarget(employeeId, metricId);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe(positionTargetId);
    expect(resolved?.targetQuantity).toBe(300);
  });

  it('H1 Priority: Resolves to EMPLOYEE target over POSITION target', async () => {
    const positionTargetId = uuidv4();
    const employeeTargetId = uuidv4();

    await db.insert(kpiTargets).values({
      id: positionTargetId,
      metricId,
      scopeType: 'POSITION',
      scopeId: 'Staff Cetak',
      periodType: 'WEEKLY',
      targetQuantity: 300,
      active: true,
    });

    await db.insert(kpiTargets).values({
      id: employeeTargetId,
      metricId,
      scopeType: 'EMPLOYEE',
      scopeId: employeeId,
      periodType: 'WEEKLY',
      targetQuantity: 400,
      active: true,
    });

    const resolved = await kpiService.resolveActiveTarget(employeeId, metricId);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe(employeeTargetId);
    expect(resolved?.targetQuantity).toBe(400);
  });
});
