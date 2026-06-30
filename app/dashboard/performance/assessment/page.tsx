"use client";

import { useState } from "react";
import { sizedImageSrc } from "@/lib/images/sized-image-src";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, X, ChevronRight } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface EmployeeScore {
  employeeId: string;
  currentScore: number;
  attendanceScore: number;
  kpiScore: number;
  leaderScore: number;
  tier: string;
  maintainedPerfectDays: number;
  projectedRaisePercent: number;
}

interface Employee {
  id: string;
  nip: string;
  fullName: string;
  division?: string | null;
  position?: string | null;
  profilePhoto?: string | null;
}

const CRITERIA = [
  { key: "kebersihan", label: "Kebersihan & Kerapian", desc: "Area kerja bersih, seragam rapi, personal hygiene terjaga." },
  { key: "disiplin", label: "Disiplin & Kehadiran", desc: "Tepat waktu, konsisten, tidak sering izin tanpa alasan." },
  { key: "kinerja", label: "Kinerja & Produktivitas", desc: "Menyelesaikan tugas sesuai target, inisiatif tinggi." },
  { key: "kerjasama", label: "Kerja Sama Tim", desc: "Komunikasi baik, membantu rekan, tidak konflik." },
  { key: "tanggung_jawab", label: "Tanggung Jawab", desc: "Mengakui kesalahan, menindaklanjuti tugas sampai tuntas." },
];

const TIER_STYLE: Record<string, { bg: string; fg: string }> = {
  Excellent: { bg: "#E5F2E9", fg: "#1E6B43" },
  Baik: { bg: "#EAF0F5", fg: "#3D6B8F" },
  Perhatian: { bg: "#FAF0DC", fg: "#8A5A00" },
  Kritis: { bg: "#F9E9E7", fg: "#A93B30" },
  Standard: { bg: "var(--bg-hover)", fg: "var(--text-secondary)" },
};

function scoreColor(score: number) {
  if (score >= 90) return "#1E6B43";
  if (score >= 75) return "#3D6B8F";
  if (score >= 50) return "#8A5A00";
  return "#B3362B";
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

interface AssessDrawerProps {
  employee: Employee;
  score: EmployeeScore | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function AssessDrawer({ employee, score, onClose, onSaved }: AssessDrawerProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const behaviorScore = CRITERIA.length > 0
    ? Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / CRITERIA.length * 20)
    : 0;

  const objScore = score ? Math.round((score.attendanceScore * 0.3) + (score.kpiScore * 0.5)) : 0;
  const finalScore = Math.round(objScore * 0.8 + behaviorScore * 0.2);

  const handleSave = async () => {
    const allRated = CRITERIA.every((c) => ratings[c.key]);
    if (!allRated) { setError("Semua kriteria harus dinilai (1–5 bintang)."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/performance/culture-score", {
        method: "POST",
        headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          subcriteria: ratings,
          reason: "Penilaian perilaku bulanan oleh HR Admin",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gagal menyimpan penilaian.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan penilaian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(17,17,17,0.4)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "relative", width: 540, maxWidth: "92vw", height: "100%",
        background: "var(--bg-hover)", boxShadow: "-16px 0 48px rgba(17,17,17,0.18)",
        display: "flex", flexDirection: "column",
        animation: "slideInFromRight 260ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes slideInFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: "18px 24px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #FFC107, #FFD85A)",
            color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, flexShrink: 0,
          }}>
            {employee.profilePhoto
              ? <img src={sizedImageSrc(employee.profilePhoto, 96)} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
              : initials(employee.fullName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{employee.fullName}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "monospace" }}>
              {employee.nip} · {employee.position || "—"}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>KUESIONER PENILAIAN PERILAKU</div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {CRITERIA.map((c) => (
              <div key={c.key} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{c.desc}</div>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: "#C05621" }}>
                    {ratings[c.key] ?? 0}/5
                  </span>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (ratings[c.key] ?? 0) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatings((prev) => ({ ...prev, [c.key]: star }))}
                        aria-label={`Nilai ${star}`}
                        style={{
                          flex: 1, height: 38, borderRadius: 9,
                          border: `1.5px solid ${filled ? "#FFC107" : "var(--border-color)"}`,
                          background: filled ? "#FFF8DC" : "#FFFFFF",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Star size={18} fill={filled ? "#FFC107" : "none"} stroke={filled ? "#C05621" : "var(--text-muted)"} strokeWidth={1.6} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Score impact */}
          <div style={{ marginTop: 16, background: "var(--bg-card)", borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>DAMPAK KE SKOR KENAIKAN GAJI</div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
              <div style={{ background: "var(--bg-hover)", borderRadius: 12, padding: "12px 8px" }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800 }}>{objScore}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", marginTop: 2 }}>OBJEKTIF ×80%</div>
              </div>
              <div style={{ background: "#FFF8DC", borderRadius: 12, padding: "12px 8px" }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#C05621" }}>{behaviorScore}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#8A5A00", marginTop: 2 }}>PERILAKU ×20%</div>
              </div>
              <div style={{ background: "var(--text-primary)", borderRadius: 12, padding: "12px 8px" }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: scoreColor(finalScore) }}>{finalScore}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", marginTop: 2 }}>SKOR AKHIR</div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, background: "#F9E9E7", border: "1px solid #E5B5AF", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "#A93B30", fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: "14px 24px", background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-card)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1.6, padding: 12, borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #FFC93C, #FFA000)",
              color: "var(--text-primary)", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Menyimpan…" : "Simpan Penilaian"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PenilaianPerilakuPage() {
  const queryClient = useQueryClient();
  const [openEmployeeId, setOpenEmployeeId] = useState<string | null>(null);

  const { data: scores = [], isPending: scoresLoading } = useQuery<EmployeeScore[]>({
    // /scores returns the per-employee score rows; /scores/summary is a single
    // aggregate object ({ total, avgScore }) and would break scores.map below.
    queryKey: ["performance-scores-all"],
    queryFn: () => fetchApiList<EmployeeScore>("/api/performance/scores", "Gagal memuat skor"),
    staleTime: 60_000,
  });

  const { data: employees = [], isPending: empsLoading } = useQuery<Employee[]>({
    queryKey: ["employees-list-assessment"],
    queryFn: () => fetchApiList<Employee>("/api/employees?limit=200", "Gagal memuat karyawan"),
    staleTime: 60_000,
  });

  const loading = scoresLoading || empsLoading;

  // Defensive: never let an unexpected (non-array) response white-screen the page.
  const scoreList = Array.isArray(scores) ? scores : [];
  const scoreMap = new Map<string, EmployeeScore>(scoreList.map((s) => [s.employeeId, s]));

  const rows = employees.map((e) => {
    const s = scoreMap.get(e.id);
    const objScore = s ? Math.round(s.attendanceScore * 0.3 + s.kpiScore * 0.5) : 0;
    const behaviorScore = s ? Math.round(s.leaderScore) : 0;
    const finalScore = s ? Math.round(s.currentScore) : 0;
    const tier = s?.tier ?? "Standard";
    const tierStyle = TIER_STYLE[tier] ?? TIER_STYLE.Standard;
    const raiseLabel = s && s.projectedRaisePercent > 0 ? `+${s.projectedRaisePercent}%` : "—";
    const raiseBg = s && s.projectedRaisePercent > 3 ? "#E5F2E9" : s && s.projectedRaisePercent > 0 ? "#FFF8E1" : "var(--bg-hover)";
    const raiseFg = s && s.projectedRaisePercent > 3 ? "#1E6B43" : s && s.projectedRaisePercent > 0 ? "#8A5A00" : "var(--text-muted)";
    return { ...e, objScore, behaviorScore, finalScore, tier, tierStyle, raiseLabel, raiseBg, raiseFg, s };
  });

  const assessedCount = rows.filter((r) => r.s?.leaderScore && r.s.leaderScore > 0).length;
  const openEmployee = openEmployeeId ? employees.find((e) => e.id === openEmployeeId) : null;

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", maxWidth: 1040, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Penilaian Perilaku</h1>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Kuesioner kebersihan, ketepatan waktu, kedisiplinan, kinerja &amp; kerja sama — berlaku untuk leader &amp; karyawan.
          </div>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {assessedCount}/{rows.length} dinilai
        </span>
      </div>

      {/* Weight explainer */}
      <div style={{
        marginTop: 14, maxWidth: 1040, background: "var(--text-primary)", borderRadius: 16,
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>Bobot Skor Kenaikan Gaji Tahun Depan</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.55 }}>
            Skor akhir (0–100) = <strong style={{ color: "#FFFFFF" }}>80% objektif</strong> (absensi + KPI sistem) + <strong style={{ color: "#FFC107" }}>20% penilaian perilaku</strong> dari kuesioner ini.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: "var(--text-primary)", borderRadius: 12, padding: "11px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#FFFFFF" }}>80%</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)", marginTop: 2 }}>OBJEKTIF</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 18, color: "var(--text-secondary)" }}>+</div>
          <div style={{ background: "linear-gradient(135deg, #FFC93C, #FFA000)", borderRadius: 12, padding: "11px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>20%</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#6B4E00", marginTop: 2 }}>PERILAKU</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        marginTop: 16, maxWidth: 1040, background: "var(--bg-card)", border: "1px solid #FFFFFF",
        borderRadius: 20, boxShadow: "0 2px 4px rgba(28,32,38,0.03), 0 12px 32px rgba(28,32,38,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1.3fr 0.9fr",
          padding: "9px 20px", background: "var(--bg-hover)", borderBottom: "1px solid var(--border-color)",
          fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)",
        }}>
          <span>NAMA</span><span>DIVISI</span><span>OBJEKTIF 80%</span><span>PERILAKU 20%</span><span>SKOR AKHIR</span><span>AKSI</span>
        </div>

        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <LoadingSpinner size="md" message="Memuat data..." />
          </div>
        )}

        {!loading && rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1.3fr 0.9fr",
              padding: "11px 20px", borderBottom: "1px solid var(--bg-hover)", alignItems: "center", fontSize: 12.5,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {row.profilePhoto
                ? <img src={sizedImageSrc(row.profilePhoto, 64)} loading="lazy" decoding="async" alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF8DC", color: "#C05621", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{initials(row.fullName)}</div>
              }
              <span>
                <span style={{ display: "block", fontWeight: 700 }}>{row.fullName}</span>
                <span style={{ display: "block", fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{row.nip}</span>
              </span>
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: 11.5 }}>{row.division ?? "—"}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{row.objScore}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: row.behaviorScore > 0 ? "#C05621" : "var(--text-muted)" }}>
              {row.behaviorScore > 0 ? row.behaviorScore : "—"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: scoreColor(row.finalScore) }}>{row.finalScore}</span>
              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 9.5, fontWeight: 700, background: row.raiseBg, color: row.raiseFg, whiteSpace: "nowrap" }}>
                {row.raiseLabel}
              </span>
            </span>
            <span>
              <button
                type="button"
                onClick={() => setOpenEmployeeId(row.id)}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border-color)", background: "var(--bg-card)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                Nilai
              </button>
            </span>
          </div>
        ))}

        {!loading && rows.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Tidak ada data karyawan.
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-muted)", maxWidth: 1040 }}>
        Tiap kriteria dinilai 1–5 bintang → dirata-rata jadi skor perilaku 0–100. Disimpan &amp; tercatat di Audit Log.
      </div>

      {openEmployee && (
        <AssessDrawer
          employee={openEmployee}
          score={scoreMap.get(openEmployee.id)}
          onClose={() => setOpenEmployeeId(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["performance-scores-all"] })}
        />
      )}
    </div>
  );
}
