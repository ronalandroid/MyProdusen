"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Sparkles, ChevronDown } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import type { DashboardStats, SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { numberFormatter } from "./constants";
import { GamificationBadge } from "./GamificationBadge";

interface SuperadminGamificationHubProps {
  stats: DashboardStats;
  insights?: SuperadminInsights;
  performanceSummaries: any[];
  performanceAnomalies: any[];
  onReload: () => void;
}

export function SuperadminGamificationHub({
  stats,
  insights,
  performanceSummaries,
  performanceAnomalies,
  onReload,
}: SuperadminGamificationHubProps) {
  const attendancePercent = Math.round(stats.todayAttendance.percentage || 0);
  const kpiScore = insights?.kpiOverview.averageScore ?? 0;
  const healthyTeams = insights?.divisionMonitoring.filter((division) => division.attendanceRate >= 90).length ?? 0;
  const totalTeams = insights?.divisionMonitoring.length ?? 0;

  // Tier distributions
  const tierCounts = performanceSummaries.reduce(
    (acc: Record<string, number>, curr: any) => {
      const tier = curr.tier || "Standard";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0, Standard: 0 }
  );

  // Raise Budget Projection estimation
  // Base Salary fallback is Rp3.500.000 for Medan Dimsum employee reference
  const DEFAULT_MEDAN_BASE_SALARY = 3500000;
  const totalProjectedRaiseAmount = performanceSummaries.reduce((sum: number, curr: any) => {
    const raisePercent = curr.projectedRaisePercent ?? 0;
    const raiseAmount = DEFAULT_MEDAN_BASE_SALARY * (raisePercent / 100);
    return sum + raiseAmount;
  }, 0);

  // Override State for anomalies
  const [activeOverrideMemberId, setActiveOverrideMemberId] = useState<string | null>(null);
  const [overrideLeaderScoreInput, setOverrideLeaderScoreInput] = useState<number | "">("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Superadmin subcriteria states
  // Progressive disclosure: lead with the actionable summary; the dense
  // gamification + performance cluster is collapsed by default.
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [adminSubcriteriaEnabled, setAdminSubcriteriaEnabled] = useState(false);
  const [adminCleanliness, setAdminCleanliness] = useState(80);
  const [adminDiscipline, setAdminDiscipline] = useState(80);
  const [adminNeatness, setAdminNeatness] = useState(80);
  const [adminSop, setAdminSop] = useState(80);
  const [adminTeamwork, setAdminTeamwork] = useState(80);
  const [adminResponsibility, setAdminResponsibility] = useState(80);

  const handleOpenOverride = (employeeId: string, currentScore: number) => {
    setActiveOverrideMemberId(employeeId);
    setOverrideLeaderScoreInput(currentScore);
    setOverrideReason("");
    setOverrideFeedback(null);
    setAdminSubcriteriaEnabled(false);
    setAdminCleanliness(80);
    setAdminDiscipline(80);
    setAdminNeatness(80);
    setAdminSop(80);
    setAdminTeamwork(80);
    setAdminResponsibility(80);
  };

  const handleAdminSubcriteriaChange = (key: string, val: number) => {
    let c = adminCleanliness, d = adminDiscipline, n = adminNeatness, s = adminSop, t = adminTeamwork, r = adminResponsibility;
    if (key === 'cleanliness') { setAdminCleanliness(val); c = val; }
    else if (key === 'discipline') { setAdminDiscipline(val); d = val; }
    else if (key === 'neatness') { setAdminNeatness(val); n = val; }
    else if (key === 'sop') { setAdminSop(val); s = val; }
    else if (key === 'teamwork') { setAdminTeamwork(val); t = val; }
    else if (key === 'responsibility') { setAdminResponsibility(val); r = val; }

    const avg = Math.round((c + d + n + s + t + r) / 6);
    setOverrideLeaderScoreInput(avg);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOverrideMemberId || overrideLeaderScoreInput === "") return;
    setOverrideSaving(true);
    setOverrideFeedback(null);

    try {
      if (overrideReason.trim().length < 10) {
        throw new Error("Alasan override minimal 10 karakter.");
      }

      const currentSummary = performanceSummaries.find(s => s.employeeId === activeOverrideMemberId);
      const existingAttendance = currentSummary?.attendanceScore ?? 100;
      const existingKpi = currentSummary?.kpiScore ?? 100;

      const res = await fetch(`/api/performance/scores/${activeOverrideMemberId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          score: Number(overrideLeaderScoreInput),
          attendanceScore: existingAttendance,
          kpiScore: existingKpi,
          leaderScore: Number(overrideLeaderScoreInput),
          reason: overrideReason.trim(),
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || "Gagal meng-override skor.");
      }

      setOverrideFeedback({ type: "success", message: "Skor berhasil dioverride dengan audit!" });
      onReload();
      setTimeout(() => {
        setActiveOverrideMemberId(null);
      }, 1500);
    } catch (err) {
      setOverrideFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal meng-override skor.",
      });
    } finally {
      setOverrideSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 mb-6" aria-labelledby="superadmin-gamification-title">
      <button
        type="button"
        onClick={() => setShowCompanyDetail((value) => !value)}
        aria-expanded={showCompanyDetail}
        className="flex items-center justify-center gap-1.5 self-start rounded-2xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-xs font-extrabold text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary-dark)] min-h-[44px]"
      >
        {showCompanyDetail ? "Sembunyikan detail kinerja & gamifikasi" : "Lihat detail kinerja & gamifikasi"}
        <ChevronDown size={14} className="transition-transform" style={{ transform: showCompanyDetail ? "rotate(0deg)" : "rotate(-90deg)" }} aria-hidden="true" />
      </button>

      {showCompanyDetail && (
      <>
      {/* Company Quest Board */}
      <div className="gamification-hub animate-slide-up" style={{ animationDelay: "160ms" }}>
        <div>
          <p className="eyebrow">Gamifikasi</p>
          <h2 id="superadmin-gamification-title">Company Quest Board</h2>
          <p>Progress absensi, KPI, dan kesehatan divisi hari ini.</p>
        </div>
        <div className="gamification-metrics" role="list">
          <GamificationBadge label="Attendance Streak" value={`${attendancePercent}%`} progress={attendancePercent} tone="success" />
          <GamificationBadge label="KPI Power" value={`${kpiScore}`} progress={Math.min(100, kpiScore)} tone="warning" />
          <GamificationBadge label="Division Shield" value={`${healthyTeams}/${totalTeams}`} progress={totalTeams ? Math.round((healthyTeams / totalTeams) * 100) : 0} tone="info" />
        </div>
      </div>

      {/* Performance Overview Panel */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Tier Distribution & Budget Projection */}
        <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
          <div>
            <p className="eyebrow">Analisis Distribusi</p>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Distribusi Tier Performa</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Jumlah karyawan aktif berdasarkan peringkat pencapaian.</p>
          </div>

          <div className="flex flex-col gap-2.5 bg-gray-50/50 p-4 rounded-2xl border border-[var(--border-color)]">
            {["Platinum", "Gold", "Silver", "Bronze", "Standard"].map((tier) => {
              const count = tierCounts[tier] || 0;
              const maxCount = Math.max(...Object.values(tierCounts));
              const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={tier} className="text-xs">
                  <div className="flex justify-between items-center mb-1 font-bold text-[var(--text-secondary)]">
                    <span>Tier {tier}</span>
                    <span className="text-[var(--text-primary)]">{count} Karyawan</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        backgroundColor:
                          tier === "Platinum"
                            ? "var(--success)"
                            : tier === "Gold"
                            ? "var(--primary)"
                            : tier === "Silver"
                            ? "var(--info)"
                            : tier === "Bronze"
                            ? "var(--warning)"
                            : "var(--text-muted)",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raise Budget Projection */}
          <div className="rounded-2xl border border-[#FFE082] bg-gradient-to-r from-[#FFFDF0] to-[#FFFDEB] p-4 flex flex-col gap-1.5 shadow-sm">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#B7791F]">
              <TrendingUp size={14} />
              <span>Proyeksi Anggaran Kenaikan Gaji</span>
            </span>
            <strong className="text-lg font-black text-[var(--text-primary)]">
              {numberFormatter.format(totalProjectedRaiseAmount)}
            </strong>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium mt-0.5">
              Estimasi total kenaikan gaji bulanan tim jika performance dipertahankan setahun.
              <br />
              <span className="italic">Disclaimer: Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.</span>
            </p>
          </div>
        </div>

        {/* Top Performers and At-Risk Panel */}
        <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
          <div>
            <p className="eyebrow">Sorotan Anggota</p>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Top & At-Risk Employees</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Daftar performa terbaik dan karyawan butuh perhatian.</p>
          </div>

          {/* Top Performers list */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">⭐ Top Performers</p>
            <div className="flex flex-col gap-2">
              {performanceSummaries.slice(0, 3).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Belum ada data performa kumulatif.</p>
              ) : (
                performanceSummaries.slice(0, 3).map((snap, idx) => (
                  <div key={snap.employeeId || idx} className="flex justify-between items-center gap-3 p-2 rounded-xl bg-gray-50/50 border">
                    <div className="min-w-0">
                      <span className="text-xs font-black text-[var(--text-primary)]">#{idx+1} Karyawan</span>
                      <span className="badge badge-success text-[10px] font-bold ml-2">Tier {snap.tier}</span>
                    </div>
                    <strong className="text-xs text-[var(--text-primary)] bg-white px-2 py-0.5 rounded border shadow-sm">
                      Score: {snap.currentScore}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* At-Risk list */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-danger)] mb-2">⚠️ Karyawan Berisiko (Score &lt; 70)</p>
            <div className="flex flex-col gap-2">
              {performanceSummaries.filter((s: any) => s.currentScore < 70).slice(0, 3).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Tidak ada karyawan di bawah ambang batas performa.</p>
              ) : (
                performanceSummaries.filter((s: any) => s.currentScore < 70).slice(0, 3).map((snap) => (
                  <div key={snap.employeeId} className="flex justify-between items-center gap-3 p-2 rounded-xl bg-red-50/50 border border-red-100">
                    <div>
                      <span className="text-xs font-bold text-red-900">Karyawan Berisiko</span>
                      <span className="badge badge-danger text-[10px] font-bold ml-2">Tier {snap.tier}</span>
                    </div>
                    <strong className="text-xs text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                      Score: {snap.currentScore}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Penilaian Perilaku Kerja dashboard card */}
      <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4 animate-slide-up" style={{ animationDelay: "180ms" }}>
        <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Penilaian Perilaku Kerja (Culture & Discipline)</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Daftar karyawan aktif untuk review nilai perilaku kerja final.</p>
            <span className="text-[10px] text-[var(--danger)] font-bold mt-1.5 block">
              💡 Nilai Superadmin menjadi nilai final jika sudah diisi.
            </span>
          </div>
          <span className="badge badge-info text-xs font-bold shrink-0">{performanceSummaries.length} Karyawan</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 pr-1">
          {performanceSummaries.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic text-center py-4">Belum ada data performa karyawan.</p>
          ) : (
            performanceSummaries.map((snap, idx) => (
              <div key={snap.employeeId || idx} className="flex justify-between items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border hover:border-[var(--primary)] transition-all">
                <div className="min-w-0">
                  <strong className="text-xs text-[var(--text-primary)] font-extrabold block">Karyawan: {snap.employeeId.slice(0, 8)}...</strong>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                    Nilai Perilaku Saat Ini: <span className="font-extrabold text-[var(--text-primary)]">{snap.leaderScore ?? 100}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOverride(snap.employeeId, snap.leaderScore ?? 100)}
                  className="btn btn-primary btn-xs rounded-xl font-bold min-h-[32px] px-3 text-[11px]"
                >
                  Input Nilai Final
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Culture & Discipline Score Anomaly Queue */}
      <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Antrean Review Anomali Penilaian Perilaku</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Skor perilaku kerja di bawah 40 atau perubahan ekstrem (&gt;30 poin) masuk review Superadmin untuk persetujuan.
            </p>
          </div>
          <span className="badge badge-danger font-extrabold text-xs">{performanceAnomalies.length} Pending</span>
        </div>

        {performanceAnomalies.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] font-semibold italic bg-gray-50/50 p-4 rounded-2xl border border-dashed border-[var(--border-color)] text-center">
            Semua skor atasan bersih. Tidak ada anomali terdeteksi.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {performanceAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="rounded-2xl border border-red-200 p-4 bg-red-50/10 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="badge badge-danger text-[10px] font-black">{anomaly.type.replace(/_/g, " ")}</span>
                    <p className="text-xs text-[var(--text-secondary)] font-bold mt-1.5">
                      Karyawan ID: <span className="font-extrabold text-[var(--text-primary)]">{anomaly.employeeId.slice(0, 8)}...</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenOverride(anomaly.employeeId, 100)}
                    className="btn btn-secondary btn-xs rounded-xl font-bold min-h-[30px] text-[11px]"
                  >
                    Override Skor
                  </button>
                  <Link
                    href="/dashboard/settings"
                    className="btn btn-primary btn-xs rounded-xl font-bold min-h-[30px] text-[11px] flex items-center justify-center"
                  >
                    Tinjau Aturan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Override Score Modal Form */}
      {activeOverrideMemberId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-3xl border border-[var(--border-color)] shadow-2xl p-5 sm:p-6 w-full max-w-md flex flex-col gap-4 animate-scale-in relative">
            <div className="border-b border-[var(--border-color)] pb-3">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                Override Skor Karyawan (Audit)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Nilai performa diubah paksa oleh Superadmin dengan pencatatan audit.
              </p>
            </div>

            {overrideFeedback && (
              <div
                role="status"
                className={`rounded-xl p-3 text-xs font-semibold ${
                  overrideFeedback.type === "success"
                    ? "bg-green-50 text-[var(--success)] border border-green-200"
                    : "bg-red-50 text-[var(--danger)] border border-red-200"
                }`}
              >
                {overrideFeedback.message}
              </div>
            )}
            <form onSubmit={handleOverrideSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Input Skor Perilaku Kerja Baru (Final)
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Contoh: 90"
                  className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none font-bold text-center"
                  value={overrideLeaderScoreInput}
                  onChange={(e) => setOverrideLeaderScoreInput(e.target.value !== "" ? Number(e.target.value) : "")}
                  disabled={overrideSaving || adminSubcriteriaEnabled}
                />
              </label>

              {/* Quick score buttons */}
              <div className="flex gap-2 justify-center">
                {[80, 90, 100].map((quickVal) => (
                  <button
                    key={quickVal}
                    type="button"
                    onClick={() => setOverrideLeaderScoreInput(quickVal)}
                    disabled={overrideSaving || adminSubcriteriaEnabled}
                    className="btn btn-secondary btn-xs rounded-xl font-bold min-h-[36px] flex-1 text-xs"
                  >
                    Set {quickVal}
                  </button>
                ))}
              </div>

              {/* Optional subcriteria sliders */}
              <div className="border border-[var(--border-color)] bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-3">
                <label className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    checked={adminSubcriteriaEnabled}
                    onChange={(e) => setAdminSubcriteriaEnabled(e.target.checked)}
                  />
                  <span>Input Subkriteria Nilai (Opsional)</span>
                </label>

                {adminSubcriteriaEnabled && (
                  <div className="flex flex-col gap-3.5 mt-2 border-t border-gray-200/60 pt-3">
                    {[
                      { key: 'cleanliness', label: 'Kebersihan', value: adminCleanliness },
                      { key: 'discipline', label: 'Disiplin', value: adminDiscipline },
                      { key: 'neatness', label: 'Kerapian', value: adminNeatness },
                      { key: 'sop', label: 'Kepatuhan SOP', value: adminSop },
                      { key: 'teamwork', label: 'Kerja Sama Tim', value: adminTeamwork },
                      { key: 'responsibility', label: 'Tanggung Jawab', value: adminResponsibility }
                    ].map((sub) => (
                      <div key={sub.key} className="flex flex-col gap-1 text-xs font-bold text-[var(--text-secondary)]">
                        <div className="flex justify-between items-center">
                          <span>{sub.label}</span>
                          <span className="text-[var(--text-primary)] font-extrabold">{sub.value}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          aria-label={`Nilai ${sub.label}`}
                          className="w-full accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                          value={sub.value}
                          onChange={(e) => handleAdminSubcriteriaChange(sub.key, Number(e.target.value))}
                        />
                      </div>
                    ))}
                    <div className="text-[10px] text-gray-500 font-bold bg-white p-2 rounded-xl border border-gray-200/60 leading-normal text-center">
                      * Nilai utama otomatis terhitung dari rata-rata 6 subkriteria di atas.
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-[var(--danger)] font-bold text-center">
                * Nilai Superadmin menjadi nilai final jika sudah diisi.
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Alasan Override Skor (Min. 10 Karakter)
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Koreksi ulasan subjektif leader setelah rapat tim..."
                  className="rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none resize-none leading-relaxed"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  disabled={overrideSaving}
                />
                <span className="text-[10px] text-[var(--text-secondary)] font-bold text-right">
                  {overrideReason.trim().length} karakter (Min. 10)
                </span>
              </label>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={overrideSaving || overrideLeaderScoreInput === "" || overrideReason.trim().length < 10}
                  className="btn btn-primary flex-1 min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{overrideSaving ? "Menyimpan..." : "Terapkan Override"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOverrideMemberId(null)}
                  disabled={overrideSaving}
                  className="btn btn-secondary flex-1 min-h-[44px] rounded-xl font-bold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
