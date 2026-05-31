import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, badgeDefinitions, employeeBadges, employees, leaderScoreAnomalies, leaderScoreEntries, performancePeriods, performanceScoreSnapshots, performanceScoreSummaries } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse } from '@/lib/utils/response';
import {
  DEFAULT_GAMIFICATION_SETTINGS,
  calculatePerformanceScore,
  detectLeaderScoreAnomaly,
  mapRaiseTier,
  sanitizeThemeInput,
  validateGamificationWeights,
} from './performance-core';

const gamificationSettings = { ...DEFAULT_GAMIFICATION_SETTINGS };
let themeSetting = sanitizeThemeInput({});

function isSuperadmin(role: string) { return role === 'SUPERADMIN'; }
function isLeader(role: string) { return role === 'LEADER'; }

async function currentEmployee(userId: string) {
  const [employee] = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return employee;
}

function handleError(error: any) {
  if (error.message === 'Unauthorized') return unauthorizedResponse();
  return errorResponse(error.message || 'Gagal memproses performance');
}

export async function requireSuperadmin(request: NextRequest) {
  const user = await requireAuth(request);
  if (!isSuperadmin(user.role)) throw new Error('FORBIDDEN');
  return user;
}

export async function getPerformanceMe(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const employee = await currentEmployee(user.userId);
    if (!employee) return errorResponse('Data karyawan tidak ditemukan', 404);
    const [summary] = await db.select().from(performanceScoreSummaries).where(eq(performanceScoreSummaries.employeeId, employee.id)).limit(1);
    const score = summary ?? { employeeId: employee.id, currentScore: 100, attendanceScore: 100, kpiScore: 100, leaderScore: 100, tier: 'Platinum', maintainedPerfectDays: 0, projectedRaisePercent: 0 };
    return successResponse({ ...score, raiseProjectionDisclaimer: 'Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.' });
  } catch (error: any) { return handleError(error); }
}

export async function getPerformanceHistory(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const employee = await currentEmployee(user.userId);
    if (!employee) return errorResponse('Data karyawan tidak ditemukan', 404);
    const rows = await db.select().from(performanceScoreSnapshots).where(eq(performanceScoreSnapshots.employeeId, employee.id)).orderBy(desc(performanceScoreSnapshots.scoreDate)).limit(365);
    return successResponse(rows);
  } catch (error: any) { return handleError(error); }
}

export async function getPerformanceBadges(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const employee = await currentEmployee(user.userId);
    if (!employee) return errorResponse('Data karyawan tidak ditemukan', 404);
    const rows = await db
      .select({ id: employeeBadges.id, awardedAt: employeeBadges.awardedAt, code: badgeDefinitions.code, name: badgeDefinitions.name, description: badgeDefinitions.description })
      .from(employeeBadges)
      .innerJoin(badgeDefinitions, eq(employeeBadges.badgeDefinitionId, badgeDefinitions.id))
      .where(eq(employeeBadges.employeeId, employee.id))
      .orderBy(desc(employeeBadges.awardedAt));
    return successResponse(rows);
  } catch (error: any) { return handleError(error); }
}

export async function listPeriods(request: NextRequest) {
  try {
    await requireSuperadmin(request);
    return successResponse(await db.select().from(performancePeriods).orderBy(desc(performancePeriods.startDate)));
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function createPeriod(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    const body = await request.json();
    const row = { id: nanoid(), name: body.name, startDate: body.startDate, endDate: body.endDate, createdBy: user.userId };
    const [created] = await db.insert(performancePeriods).values(row).returning();
    await logAudit(user.userId, 'CREATE', 'PerformancePeriod', created.id, undefined, created, request);
    return successResponse(created, 'Periode performance dibuka', 201);
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function closePeriod(request: NextRequest, id: string) {
  try {
    const user = await requireSuperadmin(request);
    const [closed] = await db.update(performancePeriods).set({ status: 'CLOSED', closedBy: user.userId, closedAt: new Date(), updatedAt: new Date() }).where(eq(performancePeriods.id, id)).returning();
    await logAudit(user.userId, 'CLOSE', 'PerformancePeriod', id, undefined, closed, request);
    return successResponse(closed, 'Periode performance ditutup');
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function getSettings(request: NextRequest) {
  try { await requireSuperadmin(request); return successResponse(gamificationSettings); } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function patchSettings(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    const body = await request.json();
    if (body.weights) gamificationSettings.weights = validateGamificationWeights(body.weights);
    if (body.raiseTiers) gamificationSettings.raiseTiers = body.raiseTiers;
    await logAudit(user.userId, 'UPDATE', 'GamificationSetting', 'company', undefined, gamificationSettings, request);
    return successResponse(gamificationSettings, 'Pengaturan gamification diperbarui');
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function getTheme(request: NextRequest) {
  try { await requireAuth(request); return successResponse(themeSetting); } catch (error: any) { return handleError(error); }
}

export async function patchTheme(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    const body = await request.json();
    const oldTheme = themeSetting;
    themeSetting = body.reset ? sanitizeThemeInput({}) : sanitizeThemeInput(body);
    await logAudit(user.userId, 'UPDATE', 'CompanyThemeSetting', 'company', oldTheme, themeSetting, request);
    return successResponse(themeSetting, 'Tema MyProdusen diperbarui');
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function leaderScore(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isLeader(user.role)) return forbiddenResponse();
    const leader = await currentEmployee(user.userId);
    if (!leader) return errorResponse('Data leader tidak ditemukan', 404);
    const body = await request.json();
    const [target] = await db.select().from(employees).where(eq(employees.id, body.employeeId)).limit(1);
    if (!target || target.supervisorId !== leader.id) return forbiddenResponse('Leader hanya dapat menilai anggota tim sendiri');
    if (target.id === leader.id) return forbiddenResponse('Leader tidak dapat menilai diri sendiri');
    const score = Number(body.score);
    const notes = String(body.notes || '').trim();
    if (!Number.isInteger(score) || score < 0 || score > 100 || notes.length < 10) return errorResponse('Score 0-100 dan notes minimal 10 karakter', 422);
    const [previous] = await db.select().from(leaderScoreEntries).where(eq(leaderScoreEntries.employeeId, target.id)).orderBy(desc(leaderScoreEntries.createdAt)).limit(1);
    const [entry] = await db.insert(leaderScoreEntries).values({ id: nanoid(), employeeId: target.id, leaderEmployeeId: leader.id, score, notes, scoreDate: body.scoreDate ?? new Date().toISOString().slice(0, 10), createdBy: user.userId }).returning();
    const anomalies = detectLeaderScoreAnomaly({ score, previousScore: previous?.score });
    for (const type of anomalies) await db.insert(leaderScoreAnomalies).values({ id: nanoid(), leaderScoreEntryId: entry.id, employeeId: target.id, type });
    await logAudit(user.userId, 'CREATE', 'LeaderScoreEntry', entry.id, undefined, { ...entry, anomalies }, request);
    return successResponse({ entry, anomalies }, anomalies.length ? 'Skor tersimpan dan masuk antrian review' : 'Skor leader tersimpan');
  } catch (error: any) { return handleError(error); }
}

export async function superadminScores(request: NextRequest) {
  try { await requireSuperadmin(request); return successResponse(await db.select().from(performanceScoreSummaries).orderBy(desc(performanceScoreSummaries.currentScore)).limit(200)); } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function scoreSummary(request: NextRequest) {
  try {
    await requireSuperadmin(request);
    const [row] = await db.select({ total: sql<number>`count(*)::int`, avgScore: sql<number>`coalesce(avg("currentScore"), 100)::float` }).from(performanceScoreSummaries);
    return successResponse(row ?? { total: 0, avgScore: 100 });
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function leaderboard(request: NextRequest, leaderOnly = false) {
  try {
    const user = await requireAuth(request);
    if (leaderOnly) {
      if (!isLeader(user.role)) return forbiddenResponse();
      const leader = await currentEmployee(user.userId);
      if (!leader) return errorResponse('Data leader tidak ditemukan', 404);
      const rows = await db
        .select({
          employeeId: performanceScoreSummaries.employeeId,
          currentScore: performanceScoreSummaries.currentScore,
          attendanceScore: performanceScoreSummaries.attendanceScore,
          kpiScore: performanceScoreSummaries.kpiScore,
          leaderScore: performanceScoreSummaries.leaderScore,
          tier: performanceScoreSummaries.tier,
          maintainedPerfectDays: performanceScoreSummaries.maintainedPerfectDays,
        })
        .from(performanceScoreSummaries)
        .innerJoin(employees, eq(performanceScoreSummaries.employeeId, employees.id))
        .where(eq(employees.supervisorId, leader.id))
        .orderBy(desc(performanceScoreSummaries.currentScore))
        .limit(25);
      return successResponse(rows);
    }
    if (!isSuperadmin(user.role)) return forbiddenResponse('Leader tidak dapat melihat leaderboard global');
    return successResponse(await db.select().from(performanceScoreSummaries).orderBy(desc(performanceScoreSummaries.currentScore)).limit(25));
  } catch (error: any) { return handleError(error); }
}

export async function anomalies(request: NextRequest) {
  try { await requireSuperadmin(request); return successResponse(await db.select().from(leaderScoreAnomalies).where(eq(leaderScoreAnomalies.status, 'PENDING')).orderBy(desc(leaderScoreAnomalies.createdAt))); } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function overrideScore(request: NextRequest, employeeId: string) {
  try {
    const user = await requireSuperadmin(request);
    const body = await request.json();
    const reason = String(body.reason || '').trim();
    if (reason.length < 10) return errorResponse('Alasan override minimal 10 karakter', 422);
    const fallbackScore = Number(body.score);
    const attendanceScore = Number(body.attendanceScore ?? fallbackScore);
    const kpiScore = Number(body.kpiScore ?? fallbackScore);
    const leaderScore = Number(body.leaderScore ?? fallbackScore);
    if (![attendanceScore, kpiScore, leaderScore].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) {
      return errorResponse('Score override harus berupa angka 0-100', 422);
    }
    const calculated = calculatePerformanceScore({ attendanceScore, kpiScore, leaderScore });
    const tier = mapRaiseTier(calculated.totalScore, body.maintainedPerfectDays ?? 0)?.name ?? 'Standard';
    const summary = {
      id: body.summaryId ?? nanoid(),
      employeeId,
      currentScore: calculated.totalScore,
      attendanceScore: calculated.breakdown.attendanceScore,
      kpiScore: calculated.breakdown.kpiScore,
      leaderScore: calculated.breakdown.leaderScore,
      tier,
      maintainedPerfectDays: body.maintainedPerfectDays ?? 0,
      projectedRaisePercent: mapRaiseTier(calculated.totalScore, body.maintainedPerfectDays ?? 0)?.raisePercent ?? 0,
      updatedAt: new Date(),
    };
    const [saved] = await db
      .insert(performanceScoreSummaries)
      .values(summary)
      .onConflictDoUpdate({ target: performanceScoreSummaries.employeeId, set: summary })
      .returning();
    await logAudit(user.userId, 'OVERRIDE', 'PerformanceScoreSummary', employeeId, undefined, { ...saved, reason }, request);
    return successResponse(saved, 'Skor performance dioverride dengan audit');
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}
