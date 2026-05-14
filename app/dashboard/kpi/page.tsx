"use client";

const kpiData = [
  { name: "Ahmad Fadlan", division: "Produksi", period: "Mei 2026", score: 95.2, grade: "A", items: 5, approved: true },
  { name: "Eko Prasetyo", division: "Gudang", period: "Mei 2026", score: 91.8, grade: "A", items: 4, approved: true },
  { name: "Siti Nurhaliza", division: "Packing", period: "Mei 2026", score: 88.5, grade: "B", items: 5, approved: false },
  { name: "Rina Wati", division: "Admin", period: "Mei 2026", score: 86.1, grade: "B", items: 3, approved: false },
  { name: "Joko Widodo", division: "Sales", period: "Mei 2026", score: 84.3, grade: "B", items: 6, approved: true },
  { name: "Budi Santoso", division: "Gudang", period: "Mei 2026", score: 72.4, grade: "C", items: 4, approved: false },
  { name: "Dewi Kartini", division: "Admin", period: "Mei 2026", score: 68.9, grade: "D", items: 3, approved: true },
  { name: "Maya Putri", division: "Packing", period: "Mei 2026", score: 90.1, grade: "A", items: 5, approved: true },
];

export default function KpiPage() {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "#22C55E";
      case "B": return "#3B82F6";
      case "C": return "#F59E0B";
      case "D": return "#EF4444";
      case "E": return "#DC2626";
      default: return "#8B91A8";
    }
  };

  const avgScore = (kpiData.reduce((a, b) => a + b.score, 0) / kpiData.length).toFixed(1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>📊 KPI Management</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Kelola dan pantau performa karyawan</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm">📋 Template KPI</button>
          <button className="btn btn-primary">➕ Input KPI</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Skor Rata-rata", value: avgScore, icon: "📊", color: "#3B82F6" },
          { label: "Grade A", value: kpiData.filter(k => k.grade === "A").length, icon: "🏆", color: "#22C55E" },
          { label: "Grade B", value: kpiData.filter(k => k.grade === "B").length, icon: "👍", color: "#3B82F6" },
          { label: "Perlu Perbaikan", value: kpiData.filter(k => k.grade === "C" || k.grade === "D" || k.grade === "E").length, icon: "⚠️", color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: s.color }} />
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {kpiData.map((kpi, i) => (
          <div key={i} className="card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: getGradeColor(kpi.grade) }} />
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="avatar avatar-sm">{kpi.name.charAt(0)}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{kpi.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{kpi.division}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: getGradeColor(kpi.grade) }}>{kpi.grade}</div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Skor Total</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: getGradeColor(kpi.grade) }}>{kpi.score}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${kpi.score}%`, background: `linear-gradient(90deg, ${getGradeColor(kpi.grade)}, ${getGradeColor(kpi.grade)}80)` }} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                <span>📋 {kpi.items} items</span>
                <span>📅 {kpi.period}</span>
              </div>
              <span className={`badge ${kpi.approved ? "badge-success" : "badge-warning"}`} style={{ fontSize: "10px" }}>
                {kpi.approved ? "Approved" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
