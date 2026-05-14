"use client";

export default function ReportsPage() {
  const reports = [
    { title: "Laporan Kehadiran Harian", desc: "Rekap absensi per hari", icon: "📅", color: "#3B82F6" },
    { title: "Laporan Kehadiran Bulanan", desc: "Rekap absensi per bulan", icon: "📆", color: "#22C55E" },
    { title: "Laporan Keterlambatan", desc: "Daftar karyawan terlambat", icon: "⏰", color: "#F59E0B" },
    { title: "Laporan KPI Individu", desc: "Skor KPI per karyawan", icon: "📊", color: "#8B5CF6" },
    { title: "Laporan KPI Divisi", desc: "Performa per divisi", icon: "🏢", color: "#06B6D4" },
    { title: "Laporan Izin/Cuti", desc: "Statistik izin dan cuti", icon: "📋", color: "#EC4899" },
    { title: "Laporan Performa", desc: "Performa perusahaan keseluruhan", icon: "📈", color: "#10B981" },
    { title: "Laporan Absensi Luar Radius", desc: "Absensi di luar area kerja", icon: "🚨", color: "#EF4444" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>📈 Laporan</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Generate dan export laporan perusahaan</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {reports.map((report, i) => (
          <div key={i} className="card" style={{ padding: "24px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: report.color }} />
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", background: `${report.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                {report.icon}
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>{report.title}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{report.desc}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: "12px" }}>📄 Preview</button>
              <button className="btn btn-primary btn-sm" style={{ fontSize: "12px" }}>📤 CSV</button>
              <button className="btn btn-success btn-sm" style={{ fontSize: "12px" }}>📊 Excel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
