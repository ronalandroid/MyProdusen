export default function DashboardLoading() {
  return (
    <div className="phone-screen feature-screen" role="status" aria-live="polite">
      <div className="card" style={{ padding: "20px", display: "grid", gap: "12px" }}>
        <div style={{ width: "45%", height: "20px", borderRadius: "999px", background: "var(--bg-secondary)" }} />
        <div style={{ width: "75%", height: "12px", borderRadius: "999px", background: "var(--bg-secondary)" }} />
        <div style={{ width: "60%", height: "12px", borderRadius: "999px", background: "var(--bg-secondary)" }} />
      </div>
      <span className="sr-only">Memuat halaman...</span>
    </div>
  );
}
