"use client";

import { ChevronRight, Activity, TrendingUp, Calendar, Award } from "lucide-react";
import { formatShortDate, statusLabel } from "./helpers";
import type { PerformanceScore, PerformanceHistoryItem, PerformanceBadge } from "./types";

type StreakCell =
  | { key: string; blank: true }
  | { key: string; blank: false; day: number; status: string; isToday: boolean };

interface PerformanceSectionProps {
  isPerfLoading: boolean;
  perfProgressState: string;
  perfScore: PerformanceScore | null;
  perfHistory: PerformanceHistoryItem[];
  perfBadges: PerformanceBadge[];
  currentScoreOutOfTen: string;
  scoreTone: { label: string; text: string; ring: string; bg: string; border: string };
  motivationCopy: string;
  currentStreak: number;
  onTimeDays: number;
  monthCountsHadir: number;
  monthCountsCuti: number;
  streakCalendar: StreakCell[];
  showPerformanceDetail: boolean;
  onToggleDetail: () => void;
}

export function PerformanceSection({
  isPerfLoading,
  perfProgressState,
  perfScore,
  perfHistory,
  perfBadges,
  currentScoreOutOfTen,
  scoreTone,
  motivationCopy,
  currentStreak,
  onTimeDays,
  monthCountsHadir,
  monthCountsCuti,
  streakCalendar,
  showPerformanceDetail,
  onToggleDetail,
}: PerformanceSectionProps) {
  return (
    <section aria-labelledby="gamification-section-title" className="flex flex-col gap-4">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Gamifikasi & Skor</p>
          <h2 id="gamification-section-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
            Performa & Kinerja Saya
          </h2>
        </div>
      </div>

      {isPerfLoading ? (
        /* Skeletons screens for dashboard cards / score card */
        <div className="card p-5 flex flex-col gap-4 animate-pulse border border-[var(--border-color)] bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="size-16 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
          <div className="text-xs text-[var(--text-secondary)] font-medium text-center italic">
            {perfProgressState || "Memuat skor performa…"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Primary Score Card */}
          <div className="card p-5 sm:p-6 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                <Activity size={14} className="text-[var(--primary-dark)] animate-pulse" />
                <span>Skor Performa</span>
              </span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                (perfScore?.currentScore ?? 100) >= 90
                  ? "bg-green-50 text-[var(--success)] border-green-200"
                  : (perfScore?.currentScore ?? 100) >= 75
                  ? "bg-blue-50 text-[var(--info)] border-blue-200"
                  : (perfScore?.currentScore ?? 100) >= 60
                  ? "bg-amber-50 text-[var(--warning)] border-amber-200"
                  : "bg-red-50 text-[var(--danger)] border-red-200"
              }`}>
                Tier {perfScore?.tier || "Standard"}
              </span>
            </div>

            {/* Progress and Score Layout */}
            <div className="flex items-center gap-5 py-2">
              <div className="relative flex items-center justify-center shrink-0" style={{ width: 72, height: 72 }}>
                {/* SVG Circle Progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="36" cy="36" r="32" stroke="var(--border-color)" strokeWidth="5" fill="transparent" />
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    stroke="var(--primary)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={(2 * Math.PI * 32) * (1 - (perfScore?.currentScore ?? 100) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xl font-black text-[var(--text-primary)] mono">
                  {currentScoreOutOfTen}<span className="text-[10px] font-bold text-[var(--text-muted)]">/10</span>
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Skor Performa Saya</h3>
                <span className="sr-only">Indeks Performa Kumulatif</span>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed">
                  Dihitung realtime berdasarkan Kehadiran 30%, KPI Produksi 50%, dan Perilaku Kerja 20%.
                  Perilaku Kerja dinilai dari kebersihan, disiplin, kerapian, kepatuhan SOP, kerja sama tim, dan tanggung jawab.
                </p>
              </div>
            </div>

            {/* Attendance/KPI/Culture breakdown progress bars */}
            <div className="flex flex-col gap-3 rounded-2xl bg-gray-50/50 p-4 border border-[var(--border-color)]">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-[var(--text-secondary)]">
                  <span>Kehadiran (Bobot 30%)</span>
                  <span className="text-[var(--text-primary)]">{perfScore?.attendanceScore ?? 100}/100</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-[var(--success)] transition-all" style={{ width: `${perfScore?.attendanceScore ?? 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-[var(--text-secondary)]">
                  <span>KPI Produksi (Bobot 50%)</span>
                  <span className="text-[var(--text-primary)]">{perfScore?.kpiScore ?? 100}/100</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-[var(--info)] transition-all" style={{ width: `${perfScore?.kpiScore ?? 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-[var(--text-secondary)]">
                  <span>Perilaku Kerja (Bobot 20%)</span>
                  <span className="text-[var(--text-primary)]">{perfScore?.leaderScore ?? 100}/100</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${perfScore?.leaderScore ?? 100}%` }}></div>
                </div>

                {/* Subcriteria values if available */}
                {perfScore?.subcriteria && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-3 text-[10px] font-bold text-[var(--text-secondary)]">
                    {perfScore.subcriteria.cleanlinessScore !== undefined && (
                      <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                        <span>Kebersihan</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.cleanlinessScore}/100</span>
                      </div>
                    )}
                    {perfScore.subcriteria.disciplineScore !== undefined && (
                      <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                        <span>Disiplin</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.disciplineScore}/100</span>
                      </div>
                    )}
                    {perfScore.subcriteria.neatnessScore !== undefined && (
                      <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                        <span>Kerapian</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.neatnessScore}/100</span>
                      </div>
                    )}
                    {perfScore.subcriteria.sopComplianceScore !== undefined && (
                      <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                        <span>Kepatuhan SOP</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.sopComplianceScore}/100</span>
                      </div>
                    )}
                    {perfScore.subcriteria.teamworkScore !== undefined && (
                      <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                        <span>Kerja Sama Tim</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.teamworkScore}/100</span>
                      </div>
                    )}
                    {perfScore.subcriteria.responsibilityScore !== undefined && (
                      <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                        <span>Tanggung Jawab</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.responsibilityScore}/100</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Raise Projection Banner */}
            <div className="rounded-2xl border border-[#FFE082] bg-gradient-to-r from-[#FFFDF0] to-[#FFFDEB] p-4 flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#B7791F]">
                <TrendingUp size={15} />
                <span>Proyeksi Kenaikan Gaji</span>
              </span>
              <p className="text-xs font-bold text-[var(--text-primary)] leading-relaxed">
                Estimasi kenaikan: <span className="text-[var(--success)] font-extrabold text-sm ml-0.5">+{perfScore?.projectedRaisePercent ?? 0}%</span>.
                <span className="sr-only">estimasi kenaikan gaji tahun depan:</span>
              </p>
              {perfScore?.currentScore === 100 && (
                <p className="text-[10px] text-[#B7791F] font-bold mt-1 border-t border-[#FFF9C4] pt-2">
                  Pertahankan skor 100 selama 365 hari untuk peluang kenaikan hingga 10%.
                </p>
              )}
              <span className="text-[10px] text-[var(--text-muted)] font-medium italic leading-normal border-t border-[#FFF9C4] pt-2 mt-1">
                Estimasi ini menunggu evaluasi dan persetujuan Superadmin.
                <span className="sr-only">raiseProjectionDisclaimer</span>
              </span>
            </div>

            {/* Latest score change reason */}
            {perfHistory.length > 0 && perfHistory[0].changeReason && (
              <div className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-[var(--border-color)]">
                <span className="font-bold block text-[var(--text-primary)] mb-0.5">Catatan Perubahan Terakhir:</span>
                {perfHistory[0].changeReason}
              </div>
            )}
          </div>



          <button
            type="button"
            onClick={onToggleDetail}
            aria-expanded={showPerformanceDetail}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-xs font-extrabold text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary-dark)] min-h-[44px]"
          >
            {showPerformanceDetail ? "Sembunyikan detail kinerja" : "Lihat detail kinerja"}
            <ChevronRight size={14} className="transition-transform" style={{ transform: showPerformanceDetail ? "rotate(90deg)" : "rotate(0deg)" }} aria-hidden="true" />
          </button>

          {showPerformanceDetail && (
          <>
          {/* Attendance Streak Calendar */}
          <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4" data-testid="attendance-streak-calendar">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                  <Calendar size={14} className="text-[var(--primary-dark)]" />
                  <span>Kalender Streak Kehadiran</span>
                </span>
                <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">{motivationCopy}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${scoreTone.bg} ${scoreTone.text} ${scoreTone.border}`}>
                {scoreTone.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" aria-label="Ringkasan streak kehadiran">
              {[
                ["Streak Saat Ini", `${currentStreak} hari`],
                ["Hari Hadir Bulan Ini", `${monthCountsHadir} hari`],
                ["Tepat Waktu", `${onTimeDays} hari`],
                ["Cuti", `${monthCountsCuti} hari`],
                ["Libur", "Minggu"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[var(--border-color)] bg-[#FFFDF3] p-3 min-h-[72px]">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
                  <p className="mt-1 text-base font-black text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label="Kalender streak kehadiran bulan ini">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <span key={day} className="text-[10px] font-extrabold text-[var(--text-muted)]">{day}</span>
              ))}
              {streakCalendar.map((cell) => {
                if (cell.blank) return <span key={cell.key} aria-hidden="true" />;
                const status = cell.status || "EMPTY";
                const isAttended = status === "PRESENT" || status === "LATE";
                const isLeave = status === "LEAVE" || status === "SICK" || status === "PERMISSION";
                const label = `${cell.day} ${statusLabel[status] || (status === "OFF" ? "Libur" : status === "FUTURE" ? "Belum berjalan" : "Belum ada data")}`;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`streak-day min-h-[44px] rounded-2xl border text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 ${
                      cell.isToday ? "streak-day-today ring-2 ring-[var(--primary)]" : ""
                    } ${isAttended ? "streak-day-attended border-green-200 bg-green-50 text-[var(--success)]" : isLeave ? "border-blue-200 bg-blue-50 text-[var(--info)]" : status === "OFF" ? "border-gray-200 bg-gray-50 text-gray-400" : status === "ABSENT" ? "border-amber-200 bg-amber-50 text-[var(--warning)]" : "border-gray-100 bg-white text-gray-300"}`}
                    title={`${formatShortDate(cell.key)} · ${label}`}
                    aria-label={`${formatShortDate(cell.key)} ${label}${cell.isToday ? " hari ini" : ""}`}
                  >
                    <span className="block text-[10px] leading-none">{cell.day}</span>
                    <span className="chicken-day-marker mt-0.5 block text-base" aria-hidden="true">
                      {isAttended ? "🐔" : isLeave ? "🌿" : status === "OFF" ? "◌" : status === "ABSENT" ? "!" : "·"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label="Achievement badges">
              {[
                ["7 hari hadir", currentStreak >= 7],
                ["14 hari hadir", currentStreak >= 14],
                ["30 hari konsisten", currentStreak >= 30],
                ["Tepat waktu 7 hari", onTimeDays >= 7],
                ["KPI target tercapai", (perfScore?.kpiScore ?? 0) >= 90],
              ].map(([label, unlocked]) => (
                <div key={String(label)} className={`badge-unlock-shimmer rounded-2xl border p-3 text-xs font-extrabold ${unlocked ? "border-yellow-200 bg-[#FFF8E1] text-[var(--text-primary)]" : "border-gray-200 bg-gray-50 text-[var(--text-muted)] opacity-75"}`}>
                  <span aria-hidden="true">{unlocked ? "🏅" : "🔒"}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* SVG Score History Line Chart */}
          <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide border-b border-[var(--border-color)] pb-3">
              <Activity size={14} className="text-[var(--info)]" />
              <span>Tren Skor 7 Hari Terakhir</span>
            </span>

            {perfHistory.length < 2 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                Tren performa akan muncul setelah skor tercatat beberapa hari.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="h-32 w-full flex items-end">
                  {/* Visual SVG Line Graph */}
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="#f3f4f6" strokeWidth="0.5" />

                    {/* Score Polyline */}
                    <path
                      fill="none"
                      stroke="var(--info)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={perfHistory
                        .slice(0, 7)
                        .reverse()
                        .map((snap, idx, arr) => {
                          const x = arr.length > 1 ? (idx / (arr.length - 1)) * 100 : 50;
                          // Map score 0-100 to y 95-5 (invert scale)
                          const y = 95 - (snap.currentScore / 100) * 90;
                          return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")}
                    />

                    {/* Score dots */}
                    {perfHistory.slice(0, 7).reverse().map((snap, idx, arr) => {
                      const x = arr.length > 1 ? (idx / (arr.length - 1)) * 100 : 50;
                      const y = 95 - (snap.currentScore / 100) * 90;
                      return (
                        <circle key={snap.id || idx} cx={x} cy={y} r="2.5" fill="white" stroke="var(--info)" strokeWidth="1.5" />
                      );
                    })}
                  </svg>
                </div>

                {/* Chart Label Dates */}
                <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-bold px-1 pt-1">
                  <span>{new Date(perfHistory.slice(0, 7).reverse()[0].scoreDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  <span>Tren performa harian</span>
                  <span>{new Date(perfHistory[0].scoreDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Badge Showcase */}
          <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
            <span className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                <Award size={14} className="text-[var(--primary-dark)]" />
                <span>Showcase Badge ({Math.min(perfBadges.length, 5)})</span>
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">Pencapaian Karyawan</span>
            </span>

            {perfBadges.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                Belum ada badge diraih. Terus berkinerja baik!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {perfBadges.slice(0, 5).map((badge) => (
                  <div key={badge.id} className="flex gap-3 items-center rounded-2xl border border-[var(--border-color)] p-3 bg-gray-50/30">
                    <div className="size-10 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center shrink-0 border border-[#FFE082]">
                      <Award size={20} className="text-[var(--primary-dark)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-[var(--text-primary)] leading-tight">{badge.name}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      )}
    </section>
  );
}
