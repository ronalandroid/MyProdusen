import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, badgeDefinitions, companySettings, companyThemeSettings, employeeBadges, employees, leaderScoreAnomalies, leaderScoreEntries, notifications, performancePeriods, performanceScoreSnapshots, performanceScoreSummaries, users } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse } from '@/lib/utils/response';
import {
  DEFAULT_GAMIFICATION_SETTINGS,
  calculateCultureDisciplineScore,
  calculatePerformanceScore,
  detectCultureScoreAnomaly,
  mapRaiseTier,
  sanitizeThemeInput,
  validateGamificationWeights,
  validateRetroactiveScoreDate,
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
    const [latestEntry] = await db.select().from(leaderScoreEntries).where(and(eq(leaderScoreEntries.employeeId, employee.id), eq(leaderScoreEntries.scoreType, 'CULTURE_DISCIPLINE'))).orderBy(desc(leaderScoreEntries.createdAt)).limit(1);
    const score = summary ?? { employeeId: employee.id, currentScore: 100, attendanceScore: 100, kpiScore: 100, leaderScore: 100, tier: 'Platinum', maintainedPerfectDays: 0, projectedRaisePercent: 0 };
    return successResponse({ ...score, cultureScore: score.leaderScore, subcriteria: latestEntry?.subcriteria ?? null, scoreLabels: { attendance: 'Attendance 30%', kpi: 'KPI Produksi 50%', culture: 'Perilaku Kerja 20%' }, cultureExplanation: 'Perilaku Kerja dinilai dari kebersihan, disiplin, kerapian, kepatuhan SOP, kerja sama tim, dan tanggung jawab.', raiseProjectionDisclaimer: 'Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.' });
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

async function readGamificationSettings() {
  const [setting] = await db.select().from(companySettings).where(eq(companySettings.key, 'GAMIFICATION_CONFIG')).limit(1);
  if (!setting) return gamificationSettings;
  try {
    const parsed = JSON.parse(setting.value);
    validateGamificationWeights(parsed.weights ?? gamificationSettings.weights);
    return { ...gamificationSettings, ...parsed };
  } catch {
    return gamificationSettings;
  }
}

export async function getSettings(request: NextRequest) {
  try { await requireSuperadmin(request); return successResponse(await readGamificationSettings()); } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function patchSettings(request: NextRequest) {
  try {
    const [user, body, current] = await Promise.all([
      requireSuperadmin(request),
      request.json(),
      readGamificationSettings(),
    ]);
    const next = { ...current, ...body };
    if (next.weights) next.weights = validateGamificationWeights(next.weights);
    const value = JSON.stringify(next);
    await db.insert(companySettings).values({ id: 'setting-gamification-config', key: 'GAMIFICATION_CONFIG', value, description: 'Konfigurasi resmi gamification dan performance score MyProdusen.', updatedBy: user.userId, updatedAt: new Date() }).onConflictDoUpdate({ target: companySettings.key, set: { value, updatedBy: user.userId, updatedAt: new Date() } });
    await logAudit(user.userId, 'UPDATE', 'GamificationSetting', 'company', current, next, request);
    return successResponse(next, 'Pengaturan gamification diperbarui');
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function getTheme(request: NextRequest) {
  try {
    await requireAuth(request);
    const [stored] = await db.select().from(companyThemeSettings).limit(1);
    return successResponse(stored ?? themeSetting);
  } catch (error: any) { return handleError(error); }
}

export async function patchTheme(request: NextRequest) {
  try {
    const [user, body, [oldTheme]] = await Promise.all([
      requireSuperadmin(request),
      request.json(),
      db.select().from(companyThemeSettings).limit(1),
    ]);
    themeSetting = body.reset ? sanitizeThemeInput({}) : sanitizeThemeInput(body);
    const row = { id: oldTheme?.id ?? 'default-theme', primaryColor: themeSetting.primaryColor, secondaryColor: themeSetting.secondaryColor, accentColor: themeSetting.accentColor, themeMode: body.themeMode ?? 'default', safeTokens: themeSetting.tokens, updatedBy: user.userId, updatedAt: new Date() };
    const [saved] = await db.insert(companyThemeSettings).values(row).onConflictDoUpdate({ target: companyThemeSettings.id, set: row }).returning();
    await logAudit(user.userId, 'UPDATE', 'CompanyThemeSetting', saved.id, oldTheme, saved, request);
    return successResponse(saved, 'Tema MyProdusen diperbarui');
  } catch (error: any) { return error.message === 'FORBIDDEN' ? forbiddenResponse() : handleError(error); }
}

export async function cultureScore(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isLeader(user.role) && !isSuperadmin(user.role)) return forbiddenResponse();
    const reviewer = await currentEmployee(user.userId);
    if (!reviewer && isLeader(user.role)) return errorResponse('Data leader tidak ditemukan', 404);
    const body = await request.json();
    const [target] = await db.select().from(employees).where(eq(employees.id, body.employeeId)).limit(1);
    if (!target) return errorResponse('Data karyawan tidak ditemukan', 404);
    if (isLeader(user.role)) {
      if (!reviewer || target.supervisorId !== reviewer.id) return forbiddenResponse('Leader hanya dapat menilai anggota tim sendiri');
      if (target.id === reviewer.id) return forbiddenResponse('Leader tidak dapat menilai diri sendiri');
      if (body.overrideFinal) return forbiddenResponse('Leader tidak dapat override nilai final Superadmin');
    }
    const settings = await readGamificationSettings();
    const score = calculateCultureDisciplineScore({ score: body.score, subcriteriaEnabled: Boolean(body.subcriteriaEnabled ?? settings.cultureSubcriteriaEnabled), cleanlinessScore: body.cleanlinessScore, disciplineScore: body.disciplineScore, punctualityBehaviorScore: body.punctualityBehaviorScore, neatnessScore: body.neatnessScore, sopComplianceScore: body.sopComplianceScore, teamworkScore: body.teamworkScore, responsibilityScore: body.responsibilityScore, attitudeScore: body.attitudeScore });
    const notes = String(body.notes || '').trim();
    if (!Number.isInteger(score) || score < 0 || score > 100 || notes.length < 10) return errorResponse('Penilaian perilaku 0-100 dan notes minimal 10 karakter', 422);
    if (body.editingPrevious && String(body.reason || '').trim().length < 10) return errorResponse('Alasan edit penilaian perilaku minimal 10 karakter', 422);
    const scoreDate = body.scoreDate ?? new Date().toISOString().slice(0, 10);
    if (!validateRetroactiveScoreDate(scoreDate, settings.retroactiveLeaderScoreDays ?? 7)) return errorResponse('Tanggal score melewati batas retroaktif', 422);
    const [activePeriod] = await db.select().from(performancePeriods).where(eq(performancePeriods.status, 'ACTIVE')).limit(1);
    const [previous] = await db.select().from(leaderScoreEntries).where(eq(leaderScoreEntries.employeeId, target.id)).orderBy(desc(leaderScoreEntries.createdAt)).limit(1);
    const subcriteria = body.subcriteriaEnabled ? { cleanlinessScore: body.cleanlinessScore, disciplineScore: body.disciplineScore, punctualityBehaviorScore: body.punctualityBehaviorScore, neatnessScore: body.neatnessScore, sopComplianceScore: body.sopComplianceScore, teamworkScore: body.teamworkScore, responsibilityScore: body.responsibilityScore, attitudeScore: body.attitudeScore } : undefined;
    const [entry] = await db.insert(leaderScoreEntries).values({ id: nanoid(), employeeId: target.id, leaderEmployeeId: reviewer?.id ?? target.id, score, notes, scoreDate, periodId: body.periodId ?? activePeriod?.id, periodType: settings.leaderScorePeriodType ?? 'MONTHLY', scoreType: 'CULTURE_DISCIPLINE', scorerRole: user.role, subcriteria, isFinal: isSuperadmin(user.role), reason: body.reason, createdBy: user.userId }).returning();
    const anomalies = detectCultureScoreAnomaly({ score, previousScore: previous?.score });
    await Promise.all(
      anomalies.map((type) =>
        db.insert(leaderScoreAnomalies).values({ id: nanoid(), leaderScoreEntryId: entry.id, employeeId: target.id, type }),
      ),
    );
    if (anomalies.length) {
      const superadmins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'SUPERADMIN'));
      await Promise.all(
        superadmins.map((admin) =>
          db.insert(notifications).values({ id: nanoid(), userId: admin.id, title: 'Anomali Penilaian Perilaku', message: 'Anomali penilaian perilaku terdeteksi.', type: 'PERFORMANCE_ANOMALY' }),
        ),
      );
    }
    const auditAction = body.overrideFinal ? 'CULTURE_SCORE_OVERRIDDEN' : body.editingPrevious ? 'CULTURE_SCORE_UPDATED' : 'CULTURE_SCORE_SUBMITTED';
    await logAudit(user.userId, auditAction, 'LeaderScoreEntry', entry.id, undefined, { ...entry, cultureScore: score, anomalies, reason: body.reason }, request);
    return successResponse({ entry: { ...entry, cultureScore: score, cultureLabel: 'Penilaian Perilaku Kerja' }, anomalies }, anomalies.length ? 'Penilaian perilaku tersimpan dan masuk antrian review' : 'Penilaian perilaku tersimpan');
  } catch (error: any) { return handleError(error); }
}

export const leaderScore = cultureScore;

export async function getCultureScores(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (isSuperadmin(user.role)) return successResponse(await db.select().from(leaderScoreEntries).where(eq(leaderScoreEntries.scoreType, 'CULTURE_DISCIPLINE')).orderBy(desc(leaderScoreEntries.createdAt)).limit(200));
    const employee = await currentEmployee(user.userId);
    if (!employee) return errorResponse('Data karyawan tidak ditemukan', 404);
    if (isLeader(user.role)) {
      const rows = await db.select().from(leaderScoreEntries).innerJoin(employees, eq(leaderScoreEntries.employeeId, employees.id)).where(and(eq(leaderScoreEntries.scoreType, 'CULTURE_DISCIPLINE'), eq(employees.supervisorId, employee.id))).orderBy(desc(leaderScoreEntries.createdAt)).limit(100);
      return successResponse(rows);
    }
    return successResponse(await db.select().from(leaderScoreEntries).where(and(eq(leaderScoreEntries.scoreType, 'CULTURE_DISCIPLINE'), eq(leaderScoreEntries.employeeId, employee.id))).orderBy(desc(leaderScoreEntries.createdAt)).limit(25));
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
