"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Download, Edit } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface EmployeeDrawerProps {
  employeeId: string;
  onClose: () => void;
}

interface EmployeeDetail {
  id: string;
  nip: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  division?: string | null;
  position?: string | null;
  status: string;
  profilePhoto?: string | null;
  workStartDate?: string | null;
  workDurationDays?: number | null;
  scorePercentage?: number | null;
  address?: string | null;
  bankAccount?: string | null;
  shift?: string | null;
}

interface AttendanceRecord {
  id: string;
  checkInTime: string;
  status: string;
}

interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  total: number;
  heatmap: Array<{ date: string; status: string }>;
}

interface PayslipItem {
  id: string;
  period: string;
  netPay?: number;
  status: string;
  runId?: string;
}

const DAY_COLOR: Record<string, string> = {
  PRESENT: "#34A06A",
  LATE: "#FFC107",
  SICK: "#F0871F",
  LEAVE: "#3D6B8F",
  PERMISSION: "#9DB6C9",
  ABSENT: "#D8432F",
};

function scoreColor(score: number) {
  if (score >= 90) return "#1E6B43";
  if (score >= 75) return "#3D6B8F";
  if (score >= 50) return "#8A5A00";
  return "#B3362B";
}

function scoreTier(score: number) {
  if (score >= 90) return { label: "EXCELLENT", bg: "#E5F2E9", fg: "#1E6B43" };
  if (score >= 75) return { label: "BAIK", bg: "#EAF0F5", fg: "#3D6B8F" };
  if (score >= 50) return { label: "PERHATIAN", bg: "#FAF0DC", fg: "#8A5A00" };
  return { label: "KRITIS", bg: "#F9E9E7", fg: "#A93B30" };
}

function statusStyle(status: string) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    ACTIVE: { bg: "#E5F2E9", fg: "#1E6B43", label: "Aktif" },
    ON_LEAVE: { bg: "#FAF0DC", fg: "#8A5A00", label: "Cuti" },
    SICK: { bg: "#FAF0DC", fg: "#8A5A00", label: "Sakit" },
    TRAINING: { bg: "#EAF0F5", fg: "#3D6B8F", label: "Training" },
    INACTIVE: { bg: "#F9E9E7", fg: "#A93B30", label: "Nonaktif" },
  };
  return map[status] ?? { bg: "var(--bg-hover)", fg: "var(--text-secondary)", label: status };
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function workDuration(days: number | null | undefined) {
  if (!days) return "—";
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0 && months > 0) return `${years} thn ${months} bln`;
  if (years > 0) return `${years} thn`;
  return `${months} bln`;
}

export default function EmployeeDrawer({ employeeId, onClose }: EmployeeDrawerProps) {
  const [tab, setTab] = useState<"ringkasan" | "riwayat" | "dokumen">("ringkasan");

  const { data: emp, isPending: empLoading } = useQuery<EmployeeDetail>({
    queryKey: ["employee-detail", employeeId],
    queryFn: () => fetchApiData<EmployeeDetail>(`/api/employees/${employeeId}`, "Gagal memuat data karyawan"),
    staleTime: 30_000,
  });

  const { data: attendance } = useQuery<AttendanceSummary>({
    queryKey: ["employee-attendance-summary", employeeId],
    queryFn: async () => {
      const rows = await fetchApiData<AttendanceRecord[]>(`/api/attendance?employeeId=${employeeId}`, "");
      const recent = (rows ?? []).slice(0, 27);
      return {
        total: recent.length,
        present: recent.filter((r) => r.status === "PRESENT").length,
        late: recent.filter((r) => r.status === "LATE").length,
        absent: recent.filter((r) => r.status === "ABSENT").length,
        heatmap: recent.map((r) => ({ date: r.checkInTime?.slice(0, 10) ?? "", status: r.status })),
      };
    },
    staleTime: 60_000,
    enabled: !!emp,
  });

  const { data: payslips = [] } = useQuery<PayslipItem[]>({
    queryKey: ["employee-payslips", employeeId],
    queryFn: () => fetchApiData<PayslipItem[]>(`/api/payroll/payslips?employeeId=${employeeId}&limit=3`, ""),
    staleTime: 60_000,
    enabled: tab === "riwayat" || tab === "ringkasan",
  });

  const score = emp?.scorePercentage ?? 0;
  const tier = scoreTier(score);
  const st = emp ? statusStyle(emp.status) : { bg: "var(--bg-hover)", fg: "var(--text-secondary)", label: "" };
  const latestPayslip = payslips[0];

  const tabBg = (t: typeof tab) => tab === t ? "var(--text-primary)" : "#FFFFFF";
  const tabFg = (t: typeof tab) => tab === t ? "#FFFFFF" : "var(--text-secondary)";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(17,17,17,0.4)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "relative", width: 660, maxWidth: "92vw", height: "100%",
        background: "var(--bg-hover)", boxShadow: "-16px 0 48px rgba(17,17,17,0.18)",
        display: "flex", flexDirection: "column",
        animation: "empDrawerIn 260ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes empDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header (yellow gradient) */}
        <div style={{ background: "linear-gradient(135deg, #FFC107, #FFD85A)", padding: "20px 24px 22px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#6B4E00" }}>PROFIL KARYAWAN</span>
            <button type="button" onClick={onClose} aria-label="Tutup" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(17,17,17,0.12)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>

          {emp && (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                {emp.profilePhoto
                  ? <img src={emp.profilePhoto} alt="" style={{ width: 64, height: 64, objectFit: "cover" }} />
                  : initials(emp.fullName)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{emp.fullName}</div>
                <div style={{ fontSize: 12.5, color: "#6B4E00", fontFamily: "monospace", marginTop: 2 }}>
                  {emp.nip} · {emp.position ?? "—"}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, background: "rgba(255,255,255,0.65)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                    {emp.division ?? "—"}
                  </span>
                  <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, background: st.bg, color: st.fg }}>
                    {st.label}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.6)", borderRadius: 16, padding: "10px 18px" }}>
                <div style={{ fontFamily: "monospace", fontSize: 30, fontWeight: 800, lineHeight: 1, color: scoreColor(score) }}>{score}</div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", color: "#6B4E00", marginTop: 4 }}>{tier.label}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
            {(["ringkasan", "riwayat", "dokumen"] as const).map((t) => (
              <button type="button" key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 999, border: "none", background: tabBg(t), color: tabFg(t), fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {t === "ringkasan" ? "Ringkasan" : t === "riwayat" ? "Riwayat" : "Dokumen"}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 28px" }}>
          {empLoading && <div style={{ padding: 40, textAlign: "center" }}><LoadingSpinner size="md" /></div>}

          {!empLoading && emp && tab === "ringkasan" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#1E6B43" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34A06A", display: "inline-block" }} />
                DATA SINKRON REALTIME DARI APLIKASI
              </div>

              {/* Metric tiles */}
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "KEHADIRAN", value: attendance ? `${attendance.present}/${attendance.total}` : "—" },
                  { label: "TEPAT WAKTU", value: attendance ? `${Math.round(((attendance.present - attendance.late) / Math.max(1, attendance.present)) * 100)}%` : "—" },
                  { label: "TELAT / ALPHA", value: attendance ? `${attendance.late} / ${attendance.absent}` : "—" },
                  { label: "MASA KERJA", value: workDuration(emp.workDurationDays) },
                ].map((tile) => (
                  <div key={tile.label} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>{tile.label}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, marginTop: 3 }}>{tile.value}</div>
                  </div>
                ))}
              </div>

              {/* Attendance heatmap */}
              {attendance?.heatmap && attendance.heatmap.length > 0 && (
                <div style={{ marginTop: 14, background: "var(--bg-card)", borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>KEHADIRAN HARIAN (27 HARI KERJA)</div>
                  <div style={{ display: "flex", gap: 3, marginTop: 9 }}>
                    {attendance.heatmap.slice(0, 27).map((d, i) => (
                      <span key={i} style={{ flex: 1, height: 18, borderRadius: 4, background: DAY_COLOR[d.status] ?? "var(--border-color)" }} />
                    ))}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>
                    {[["Hadir", "#34A06A"], ["Telat", "#FFC107"], ["Sakit", "#F0871F"], ["Cuti", "#3D6B8F"], ["Izin", "#9DB6C9"], ["Alpha", "#D8432F"]].map(([label, color]) => (
                      <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: color }} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Payroll + Contact */}
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>PAYROLL TERAKHIR</div>
                  {latestPayslip ? (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Bruto</span>
                        <span style={{ fontFamily: "monospace" }}>Rp {rupiah(latestPayslip.netPay ?? 0)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--border-color)", fontWeight: 800 }}>
                        <span>Neto</span>
                        <span style={{ fontFamily: "monospace" }}>Rp {rupiah(latestPayslip.netPay ?? 0)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{latestPayslip.period}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>Belum ada data payroll.</div>
                  )}
                </div>
                <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>KONTAK &amp; KEPEGAWAIAN</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, fontSize: 11 }}>
                    {[
                      { label: "BERGABUNG", value: emp.workStartDate ? new Date(emp.workStartDate).toLocaleDateString("id-ID") : "—" },
                      { label: "SHIFT", value: emp.shift ?? "—" },
                      { label: "TELEPON", value: emp.phone ?? "—" },
                      { label: "EMAIL", value: emp.email ?? "—" },
                    ].map((item) => (
                      <div key={item.label}>
                        <span style={{ display: "block", fontSize: 8.5, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em" }}>{item.label}</span>
                        <span style={{ fontWeight: 600, fontFamily: item.label === "TELEPON" ? "monospace" : undefined }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!empLoading && emp && tab === "riwayat" && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>RIWAYAT PAYROLL</div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {payslips.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Tidak ada riwayat payroll.</div>}
                {payslips.map((p) => (
                  <div key={p.id} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.period}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        Neto: <span style={{ fontFamily: "monospace" }}>Rp {rupiah(p.netPay ?? 0)}</span>
                      </div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: p.status === "PAID" ? "#E5F2E9" : "#FAF0DC", color: p.status === "PAID" ? "#1E6B43" : "#8A5A00" }}>
                      {p.status === "PAID" ? "Dibayar" : p.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!empLoading && emp && tab === "dokumen" && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>DOKUMEN KARYAWAN</div>
              <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 13 }}>
                Dokumen dikelola melalui halaman <a href={`/dashboard/documents`} style={{ color: "#8A5A00", fontWeight: 700 }}>Dokumen</a>.
              </div>

              {emp.address && (
                <div style={{ marginTop: 16, background: "var(--bg-card)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em" }}>ALAMAT</div>
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600 }}>{emp.address}</div>
                </div>
              )}
              {emp.bankAccount && (
                <div style={{ marginTop: 10, background: "var(--bg-card)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em" }}>REKENING PAYROLL</div>
                  <div style={{ marginTop: 6, fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>{emp.bankAccount}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {emp && (
          <div style={{ flexShrink: 0, padding: "14px 24px", background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 10 }}>
            <a
              href={`/dashboard/employees/${employeeId}`}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-card)", fontSize: 13, fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Edit size={15} />
              Edit Data
            </a>
            {latestPayslip && (
              <a
                href={`/api/payroll/payslips/${latestPayslip.id}?format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FFC93C, #FFA000)", color: "var(--text-primary)", fontSize: 13, fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Download size={15} />
                Unduh Slip Gaji
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
