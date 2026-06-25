import Link from "next/link";
import type { DashboardStats } from "@/lib/dashboard/dashboard-types";

export function DecisionQueuePanel({ stats }: { stats: DashboardStats }) {
  const queues = [
    { label: "Pengecualian", count: stats.pendingAttendanceExceptions, href: "/dashboard/attendance/exceptions?status=PENDING", color: "#B3362B" },
    { label: "Cuti & Izin", count: stats.pendingLeave, href: "/dashboard/leave?status=PENDING", color: "#8A5A00" },
    { label: "Lembur", count: stats.pendingOT ?? 0, href: "/dashboard/overtime?status=PENDING", color: "#3D6B8F" },
    { label: "KPI", count: stats.pendingKpiApprovals, href: "/dashboard/kpi?status=PENDING", color: "#1E6B43" },
  ];
  const totalPending = queues.reduce((s, q) => s + q.count, 0);
  return (
    <section className="card mb-5" style={{ padding: "16px 20px" }} aria-labelledby="decision-queue-title">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>Antrian Keputusan</div>
          <h3 id="decision-queue-title" style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
            {totalPending > 0 ? `${totalPending} pengajuan menunggu` : "Tidak ada pengajuan pending"}
          </h3>
        </div>
        {totalPending > 0 && (
          <span style={{ background: "var(--danger)", color: "#FFF", fontWeight: 800, fontSize: 13, borderRadius: 20, padding: "3px 12px", fontFamily: "var(--font-mono, monospace)" }}>{totalPending}</span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {queues.map((q) => (
          <Link key={q.label} href={q.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 10, border: `1.5px solid ${q.count > 0 ? q.color + "44" : "var(--border-color)"}`, background: q.count > 0 ? q.color + "14" : "var(--bg-hover)", textDecoration: "none", transition: "box-shadow 140ms" }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: q.count > 0 ? q.color : "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>{q.count}</span>
            <span style={{ fontSize: "clamp(9.5px, 2.7vw, 11px)", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.2, wordBreak: "keep-all", hyphens: "none", maxWidth: "100%" }}>{q.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
