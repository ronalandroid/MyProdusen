import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  db,
  kpiMetrics,
  kpiProductionEntries,
  payrollRules,
  employees,
  employeeTeamAssignments,
  teams,
  users,
  payrollStructures,
  employeePayrolls,
  payrollRuns,
  payrollItems,
} from '@/lib/db';
import { payrollService } from '@/services/payroll/payroll.service';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

describe('Payroll Rules and KPI Target Bonus Calculator', () => {
  let employeeId: string;
  let teamId: string;
  let metricId: string;
  let structureId: string;
  let ruleId: string;

  beforeEach(async () => {
    employeeId = `pay_emp_${Date.now()}`;
    teamId = `pay_team_${Date.now()}`;
    metricId = `pay_met_${Date.now()}`;
    structureId = `pay_str_${Date.now()}`;
    ruleId = `pay_rule_${Date.now()}`;

    // Clean up
    await db.delete(payrollRules).where(eq(payrollRules.id, ruleId));
    await db.delete(kpiProductionEntries).where(eq(kpiProductionEntries.employeeId, employeeId));
    await db.delete(kpiMetrics).where(eq(kpiMetrics.id, metricId));
    await db.delete(employeeTeamAssignments).where(eq(employeeTeamAssignments.employeeId, employeeId));
    await db.delete(teams).where(eq(teams.id, teamId));
    await db.delete(employeePayrolls).where(eq(employeePayrolls.employeeId, employeeId));
    await db.delete(payrollStructures).where(eq(payrollStructures.id, structureId));
    await db.delete(employees).where(eq(employees.id, employeeId));
    await db.delete(users).where(eq(users.id, employeeId));

    // Seed master data
    await db.insert(kpiMetrics).values({
      id: metricId,
      name: `Cetak Dimsum ${metricId}`,
      unit: 'pack',
      active: true,
    });

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
      fullName: 'Test Payroll Employee',
      email: `${employeeId}@myprodusen.local`,
      status: 'ACTIVE',
      position: 'Staff Cetak',
    });

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

    await db.insert(payrollStructures).values({
      id: structureId,
      name: `Structure ${structureId}`,
      baseSalary: 3000000,
      isActive: true,
    });

    await db.insert(employeePayrolls).values({
      id: `emp_payroll_${employeeId}`,
      employeeId,
      structureId,
      baseSalary: 3000000,
      effectiveDate: new Date('2026-05-01'),
    });
  });

  afterEach(async () => {
    // Clean up
    await db.delete(payrollRules).where(eq(payrollRules.id, ruleId));
    await db.delete(kpiProductionEntries).where(eq(kpiProductionEntries.employeeId, employeeId));
    await db.delete(kpiMetrics).where(eq(kpiMetrics.id, metricId));
    await db.delete(employeeTeamAssignments).where(eq(employeeTeamAssignments.employeeId, employeeId));
    await db.delete(teams).where(eq(teams.id, teamId));
    await db.delete(employeePayrolls).where(eq(employeePayrolls.employeeId, employeeId));
    await db.delete(payrollStructures).where(eq(payrollStructures.id, structureId));
    await db.delete(employees).where(eq(employees.id, employeeId));
    await db.delete(users).where(eq(users.id, employeeId));
  });

  it('resolves active payroll rules based on priority hierarchy', async () => {
    // 1. Team level rule
    await db.insert(payrollRules).values({
      id: ruleId,
      teamId,
      periodType: 'MONTHLY',
      baseSalary: 3500000,
      active: true,
    });

    const resolvedTeamRule = await payrollService.resolveActivePayrollRule(employeeId);
    expect(resolvedTeamRule).not.toBeNull();
    expect(resolvedTeamRule?.baseSalary).toBe(3500000);

    // 2. Employee level rule overrides Team level rule
    const employeeRuleId = `rule_emp_${Date.now()}`;
    await db.insert(payrollRules).values({
      id: employeeRuleId,
      employeeId,
      periodType: 'MONTHLY',
      baseSalary: 4000000,
      active: true,
    });

    const resolvedEmpRule = await payrollService.resolveActivePayrollRule(employeeId);
    expect(resolvedEmpRule).not.toBeNull();
    expect(resolvedEmpRule?.baseSalary).toBe(4000000);

    // Clean up the employee rule
    await db.delete(payrollRules).where(eq(payrollRules.id, employeeRuleId));
  });

  it('calculates PER_EXTRA_UNIT bonus correctly based on KPI entries', async () => {
    // Seed rule: target = 100, bonus per extra unit = 5000
    await db.insert(payrollRules).values({
      id: ruleId,
      employeeId,
      periodType: 'MONTHLY',
      baseSalary: 3500000,
      targetMetricId: metricId,
      targetQuantity: 100,
      bonusType: 'PER_EXTRA_UNIT',
      bonusAmountPerUnit: 5000,
      active: true,
    });

    // Seed production entries totaling 120 (20 extra)
    await db.insert(kpiProductionEntries).values([
      {
        id: `entry_1_${Date.now()}`,
        employeeId,
        teamId,
        leaderUserId: 'test_leader',
        date: '3026-05-10',
        metricType: `Cetak Dimsum ${metricId}`,
        quantity: '50',
        status: 'SUBMITTED',
        createdBy: 'test_leader',
      },
      {
        id: `entry_2_${Date.now()}`,
        employeeId,
        teamId,
        leaderUserId: 'test_leader',
        date: '3026-05-15',
        metricType: `Cetak Dimsum ${metricId}`,
        quantity: '70',
        status: 'SUBMITTED',
        createdBy: 'test_leader',
      },
    ]);

    // Create a mock run
    const runId = `run_1_${Date.now()}`;
    await db.insert(payrollRuns).values({
      id: runId,
      period: '3026-05',
      periodStart: new Date('3026-05-01'),
      periodEnd: new Date('3026-05-31'),
      status: 'DRAFT',
      calculatedBy: 'test_admin',
    });

    try {
      const calculated = await payrollService.calculatePayroll(runId);
      expect(calculated).not.toBeNull();

      // Retrieve the generated payroll item
      const [item] = await db
        .select()
        .from(payrollItems)
        .where(and(eq(payrollItems.runId, runId), eq(payrollItems.employeeId, employeeId)))
        .limit(1);

      expect(item).not.toBeUndefined();
      expect(item.baseSalary).toBe(3500000); // overridden from rule
      expect(item.bonusPay).toBe(100000); // (120 - 100) * 5000 = 100000
    } finally {
      await db.delete(payrollItems).where(eq(payrollItems.runId, runId));
      await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));
    }
  });

  it('calculates FIXED bonus correctly based on KPI entries', async () => {
    // Seed rule: target = 100, fixed bonus = 250000
    await db.insert(payrollRules).values({
      id: ruleId,
      employeeId,
      periodType: 'MONTHLY',
      baseSalary: 3500000,
      targetMetricId: metricId,
      targetQuantity: 100,
      bonusType: 'FIXED',
      bonusAmountPerUnit: 250000,
      active: true,
    });

    // Seed production entries totaling 105 (>= 100)
    await db.insert(kpiProductionEntries).values([
      {
        id: `entry_1_${Date.now()}`,
        employeeId,
        teamId,
        leaderUserId: 'test_leader',
        date: '3027-05-10',
        metricType: `Cetak Dimsum ${metricId}`,
        quantity: '105',
        status: 'SUBMITTED',
        createdBy: 'test_leader',
      },
    ]);

    // Create a mock run
    const runId = `run_2_${Date.now()}`;
    await db.insert(payrollRuns).values({
      id: runId,
      period: '3027-05',
      periodStart: new Date('3027-05-01'),
      periodEnd: new Date('3027-05-31'),
      status: 'DRAFT',
      calculatedBy: 'test_admin',
    });

    try {
      await payrollService.calculatePayroll(runId);

      const [item] = await db
        .select()
        .from(payrollItems)
        .where(and(eq(payrollItems.runId, runId), eq(payrollItems.employeeId, employeeId)))
        .limit(1);

      expect(item).not.toBeUndefined();
      expect(item.bonusPay).toBe(250000);
    } finally {
      await db.delete(payrollItems).where(eq(payrollItems.runId, runId));
      await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));
    }
  });

  it('calculates PERCENTAGE bonus correctly based on KPI entries', async () => {
    // Seed rule: target = 100, percentage bonus = 10% (0.1) of base salary (3500000)
    await db.insert(payrollRules).values({
      id: ruleId,
      employeeId,
      periodType: 'MONTHLY',
      baseSalary: 3500000,
      targetMetricId: metricId,
      targetQuantity: 100,
      bonusType: 'PERCENTAGE',
      bonusAmountPerUnit: 10,
      active: true,
    });

    // Seed production entries totaling 100 (>= 100)
    await db.insert(kpiProductionEntries).values([
      {
        id: `entry_1_${Date.now()}`,
        employeeId,
        teamId,
        leaderUserId: 'test_leader',
        date: '3028-05-10',
        metricType: `Cetak Dimsum ${metricId}`,
        quantity: '100',
        status: 'SUBMITTED',
        createdBy: 'test_leader',
      },
    ]);

    // Create a mock run
    const runId = `run_3_${Date.now()}`;
    await db.insert(payrollRuns).values({
      id: runId,
      period: '3028-05',
      periodStart: new Date('3028-05-01'),
      periodEnd: new Date('3028-05-31'),
      status: 'DRAFT',
      calculatedBy: 'test_admin',
    });

    try {
      await payrollService.calculatePayroll(runId);

      const [item] = await db
        .select()
        .from(payrollItems)
        .where(and(eq(payrollItems.runId, runId), eq(payrollItems.employeeId, employeeId)))
        .limit(1);

      expect(item).not.toBeUndefined();
      expect(item.bonusPay).toBe(350000); // 10% of 3500000 = 350000
    } finally {
      await db.delete(payrollItems).where(eq(payrollItems.runId, runId));
      await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));
    }
  });
});
