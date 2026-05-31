"use client";

import { useEffect, useState } from "react";
import { Users, Award, Calendar, AlertTriangle, ArrowRight, ClipboardList, Clock, RefreshCcw, Sparkles, HelpCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Member = {
  id: string;
  nip: string;
  fullName: string;
  division?: string | null;
  position?: string | null;
  teamName: string;
  status: string;
  currentScore?: number;
  attendanceScore?: number;
  kpiScore?: number;
  leaderScore?: number;
  tier?: string;
};

type LeaderboardRow = {
  employeeId: string;
  currentScore: number;
  attendanceScore: number;
  kpiScore: number;
  leaderScore: number;
  tier: string;
  maintainedPerfectDays: number;
  fullName?: string;
  nip?: string;
};

export default function LeaderTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [progressState, setProgressState] = useState("");

  // Scoring states
  const [activeScoringMember, setActiveScoringMember] = useState<Member | null>(null);
  const [scoreInput, setScoreInput] = useState<number | "">("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Subcriteria states
  const [subcriteriaEnabled, setSubcriteriaEnabled] = useState(false);
  const [cleanlinessScore, setCleanlinessScore] = useState(80);
  const [disciplineScore, setDisciplineScore] = useState(80);
  const [neatnessScore, setNeatnessScore] = useState(80);
  const [sopComplianceScore, setSopComplianceScore] = useState(80);
  const [teamworkScore, setTeamworkScore] = useState(80);
  const [responsibilityScore, setResponsibilityScore] = useState(80);

  useEffect(() => {
    loadTeamAndLeaderboard();
  }, []);

  const loadTeamAndLeaderboard = async () => {
    try {
      setLoading(true);
      setPageError("");
      setProgressState("Memuat skor performa…");

      const [teamRes, boardRes] = await Promise.all([
        fetch("/api/leader/team-employees", { credentials: "include", cache: "no-store" }),
        fetch("/api/leader/performance/leaderboard", { credentials: "include", cache: "no-store" }),
      ]);

      const teamPayload = await teamRes.json();
      const boardPayload = await boardRes.json();

      if (!teamRes.ok || !teamPayload.success) {
        throw new Error(teamPayload.error || "Gagal mengambil data tim");
      }

      const teamList = teamPayload.data || [];
      const boardList = boardPayload.success ? (boardPayload.data || []) : [];

      // Merge scores from leaderboard to members lists
      const mergedMembers = teamList.map((m: Member) => {
        const scoreInfo = boardList.find((b: LeaderboardRow) => b.employeeId === m.id);
        return {
          ...m,
          currentScore: scoreInfo?.currentScore ?? 100,
          attendanceScore: scoreInfo?.attendanceScore ?? 100,
          kpiScore: scoreInfo?.kpiScore ?? 100,
          leaderScore: scoreInfo?.leaderScore ?? 100,
          tier: scoreInfo?.tier ?? "Standard",
        };
      });

      setMembers(mergedMembers);

      // Attach names to leaderboard rows for display
      const enrichedBoard = boardList.map((b: LeaderboardRow) => {
        const mem = teamList.find((m: Member) => m.id === b.employeeId);
        return {
          ...b,
          fullName: mem?.fullName || "Karyawan",
          nip: mem?.nip || "",
        };
      });
      setLeaderboardData(enrichedBoard);

    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Gagal mengambil data tim.");
    } finally {
      setLoading(false);
      setProgressState("");
    }
  };

  const handleOpenScoring = (member: Member) => {
    setActiveScoringMember(member);
    setScoreInput(member.leaderScore ?? 100);
    setNotesInput("");
    setSubmitFeedback(null);
    setSubcriteriaEnabled(false);
    setCleanlinessScore(80);
    setDisciplineScore(80);
    setNeatnessScore(80);
    setSopComplianceScore(80);
    setTeamworkScore(80);
    setResponsibilityScore(80);
  };

  const handleSubcriteriaSliderChange = (key: string, val: number) => {
    let c = cleanlinessScore, d = disciplineScore, n = neatnessScore, s = sopComplianceScore, t = teamworkScore, r = responsibilityScore;
    if (key === 'cleanliness') { setCleanlinessScore(val); c = val; }
    else if (key === 'discipline') { setDisciplineScore(val); d = val; }
    else if (key === 'neatness') { setNeatnessScore(val); n = val; }
    else if (key === 'sop') { setSopComplianceScore(val); s = val; }
    else if (key === 'teamwork') { setTeamworkScore(val); t = val; }
    else if (key === 'responsibility') { setResponsibilityScore(val); r = val; }
    
    const avg = Math.round((c + d + n + s + t + r) / 6);
    setScoreInput(avg);
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScoringMember || scoreInput === "") return;

    setIsSubmitting(true);
    setSubmitFeedback(null);
    setProgressState("Memproses Penilaian Perilaku…");

    try {
      const score = Number(scoreInput);
      const notes = notesInput.trim();

      if (notes.length < 10) {
        throw new Error("Notes/catatan minimal 10 karakter.");
      }

      setProgressState("Memeriksa anomali…");
      const res = await fetch("/api/leader/performance/leader-score", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          employeeId: activeScoringMember.id,
          score,
          notes,
          scoreDate: new Date().toISOString().slice(0, 10),
          subcriteriaEnabled,
          cleanlinessScore: subcriteriaEnabled ? cleanlinessScore : undefined,
          disciplineScore: subcriteriaEnabled ? disciplineScore : undefined,
          neatnessScore: subcriteriaEnabled ? neatnessScore : undefined,
          sopComplianceScore: subcriteriaEnabled ? sopComplianceScore : undefined,
          teamworkScore: subcriteriaEnabled ? teamworkScore : undefined,
          responsibilityScore: subcriteriaEnabled ? responsibilityScore : undefined,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || "Gagal menyimpan Penilaian Perilaku.");
      }

      setSubmitFeedback({
        type: "success",
        message: payload.message || "Penilaian Perilaku berhasil disimpan!",
      });

      // Reload to reflect new scores
      await loadTeamAndLeaderboard();
      
      // Auto close modal after brief delay
      setTimeout(() => {
        setActiveScoringMember(null);
      }, 1500);

    } catch (err) {
      setSubmitFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan Penilaian Perilaku.",
      });
    } finally {
      setIsSubmitting(false);
      setProgressState("");
    }
  };

  // Dynamic anomaly checks on client-side
  const enteredScore = scoreInput !== "" ? Number(scoreInput) : null;
  const isLowScoreAnomaly = enteredScore !== null && enteredScore < 40;
  const originalScore = activeScoringMember?.leaderScore ?? 100;
  const isDeltaAnomaly = enteredScore !== null && Math.abs(enteredScore - originalScore) > 30;

  return (
    <div className="dashboard-page animate-fade-in pb-10">
      <header className="dashboard-header mb-5 flex flex-wrap justify-between items-center gap-3">
        <div className="dashboard-greeting">
          <p className="eyebrow">Manajemen Tim</p>
          <h1>Tim & Kinerja Saya</h1>
          <p>Beri nilai performa bulanan dan pantau peringkat tim Anda.</p>
        </div>
        <button
          type="button"
          onClick={loadTeamAndLeaderboard}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 shrink-0"
        >
          <RefreshCcw size={14} />
          <span>Muat Ulang</span>
        </button>
      </header>

      {pageError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-[var(--danger)] mb-5 flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        /* Skeletons screens for dashboard cards / leaderboard */
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="card p-5 flex flex-col gap-4 animate-pulse border border-[var(--border-color)] bg-white">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3 mt-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-gray-200 rounded-2xl w-full"></div>
              ))}
            </div>
            <p className="text-center text-xs text-[var(--text-secondary)] font-medium italic mt-2">
              {progressState || "Memuat skor performa…"}
            </p>
          </div>
          <div className="card p-5 flex flex-col gap-4 animate-pulse border border-[var(--border-color)] bg-white">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3 mt-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-gray-200 rounded-2xl w-full"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Members Score Table/Grid */}
          <div className="flex flex-col gap-5">
            <section className="card p-5 bg-white border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">Daftar Anggota & Kinerja</h2>
                <span className="badge badge-info font-bold text-xs">{members.length} Karyawan</span>
              </div>

              {members.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                  Tidak ada anggota tim terdaftar. Hubungi Superadmin.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {members.map((member) => (
                    <article
                      key={member.id}
                      className="rounded-2xl border border-[var(--border-color)] p-4 bg-white hover:border-[var(--primary)] transition-all flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base text-[var(--text-primary)] leading-tight">{member.fullName}</h3>
                          <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">
                            {member.nip} · {member.position || "Staff"} · {member.division || "Cetak"}
                          </p>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          (member.currentScore ?? 100) >= 90
                            ? "bg-green-50 text-[var(--success)] border-green-200"
                            : (member.currentScore ?? 100) >= 75
                            ? "bg-blue-50 text-[var(--info)] border-blue-200"
                            : "bg-amber-50 text-[var(--warning)] border-amber-200"
                        }`}>
                          Score: {member.currentScore ?? 100}
                        </span>
                      </div>

                      {/* Performance Breakdown Indicators */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-gray-100 text-center">
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Absensi (30%)</p>
                          <strong className="text-sm text-[var(--text-primary)]">{member.attendanceScore ?? 100}</strong>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">KPI Produksi (50%)</p>
                          <strong className="text-sm text-[var(--text-primary)]">{member.kpiScore ?? 100}</strong>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Perilaku (20%)</p>
                          <strong className="text-sm text-[var(--text-primary)]">{member.leaderScore ?? 100}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-[var(--text-muted)]">
                          Tier Performa: {member.tier || "Standard"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenScoring(member)}
                          className="btn btn-primary btn-sm rounded-xl font-bold flex items-center gap-1 min-h-[36px]"
                        >
                          <ClipboardList size={13} />
                          <span>Input Penilaian Perilaku Tim</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Team Leaderboard Sidebar */}
          <div className="flex flex-col gap-5">
            <section className="card p-5 bg-white border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                <span className="flex items-center gap-1 text-sm font-extrabold text-[var(--text-primary)]">
                  <Award size={16} className="text-[var(--primary-dark)]" />
                  <span>Leaderboard Tim</span>
                </span>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">Skor Kumulatif</span>
              </div>

              {leaderboardData.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                  Belum ada data peringkat.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {leaderboardData.map((row, idx) => {
                    const isTop3 = idx < 3;
                    const trophyColor = idx === 0 ? "#F59E0B" : idx === 1 ? "#9CA3AF" : "#D97706";
                    return (
                      <div
                        key={row.employeeId}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          isTop3 ? "bg-amber-50/30 border-[#FFE082]" : "bg-gray-50/20 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-center text-xs font-black text-[var(--text-muted)]">
                            {isTop3 ? (
                              <Award size={14} style={{ color: trophyColor, display: "inline-block" }} />
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[var(--text-primary)] truncate">{row.fullName}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{row.nip}</p>
                          </div>
                        </div>
                        <strong className="text-xs font-extrabold text-[var(--text-primary)] shrink-0 bg-white px-2 py-0.5 rounded-md border">
                          {row.currentScore}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Modal scoring popup */}
      {activeScoringMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-3xl border border-[var(--border-color)] shadow-2xl p-5 sm:p-6 w-full max-w-md flex flex-col gap-4 animate-scale-in relative">
            <div className="border-b border-[var(--border-color)] pb-3">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                Penilaian Perilaku Kerja: {activeScoringMember.fullName}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-semibold">
                Skor perilaku saat ini: {activeScoringMember.leaderScore ?? 100}
              </p>
            </div>

            {submitFeedback && (
              <div
                role="status"
                className={`rounded-xl p-3 text-xs font-semibold ${
                  submitFeedback.type === "success"
                    ? "bg-green-50 text-[var(--success)] border border-green-200"
                    : "bg-red-50 text-[var(--danger)] border border-red-200"
                }`}
              >
                {submitFeedback.message}
              </div>
            )}

            <form onSubmit={handleScoreSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Input Skor Perilaku Kerja (0–100)
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Contoh: 85"
                  className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none font-bold text-center"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value !== "" ? Number(e.target.value) : "")}
                  disabled={isSubmitting || subcriteriaEnabled}
                />
              </label>

              {/* Optional subcriteria sliders */}
              <div className="border border-[var(--border-color)] bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-3">
                <label className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    checked={subcriteriaEnabled}
                    onChange={(e) => setSubcriteriaEnabled(e.target.checked)}
                  />
                  <span>Input Subkriteria Nilai (Opsional)</span>
                </label>

                {subcriteriaEnabled && (
                  <div className="flex flex-col gap-3.5 mt-2 border-t border-gray-200/60 pt-3">
                    {[
                      { key: 'cleanliness', label: 'Kebersihan', value: cleanlinessScore },
                      { key: 'discipline', label: 'Disiplin', value: disciplineScore },
                      { key: 'neatness', label: 'Kerapian', value: neatnessScore },
                      { key: 'sop', label: 'Kepatuhan SOP', value: sopComplianceScore },
                      { key: 'teamwork', label: 'Kerja Sama Tim', value: teamworkScore },
                      { key: 'responsibility', label: 'Tanggung Jawab', value: responsibilityScore }
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
                          className="w-full accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                          value={sub.value}
                          onChange={(e) => handleSubcriteriaSliderChange(sub.key, Number(e.target.value))}
                        />
                      </div>
                    ))}
                    <div className="text-[10px] text-gray-500 font-bold bg-white p-2 rounded-xl border border-gray-200/60 leading-normal text-center">
                      * Nilai utama otomatis terhitung dari rata-rata 6 subkriteria di atas.
                    </div>
                  </div>
                )}
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Catatan Alasan / Feedback (Min. 10 Karakter)
                <textarea
                  required
                  rows={3}
                  placeholder="Tulis umpan balik kinerja..."
                  className="rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none resize-none leading-relaxed"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-[var(--text-secondary)] font-bold text-right">
                  {notesInput.trim().length} karakter (Min. 10)
                </span>
              </label>

              {/* Anomaly warning messages */}
              {isLowScoreAnomaly && (
                <div role="status" className="rounded-xl bg-red-50 border border-red-200 p-3 text-[11px] text-[var(--danger)] font-bold leading-normal flex items-start gap-1.5 animate-slide-up">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>⚠️ Peringatan: Skor di bawah 40 tergolong sangat rendah dan akan memicu review anomali.</span>
                </div>
              )}

              {isDeltaAnomaly && (
                <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 font-bold leading-normal flex items-start gap-1.5 animate-slide-up">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>⚠️ Peringatan: Perubahan skor yang sangat drastis (&gt;30 poin) akan memicu review anomali.</span>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || scoreInput === "" || notesInput.trim().length < 10}
                  className="btn btn-primary flex-1 min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{isSubmitting ? (progressState || "Menyimpan...") : "Simpan Nilai"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScoringMember(null)}
                  disabled={isSubmitting}
                  className="btn btn-secondary flex-1 min-h-[44px] rounded-xl font-bold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
