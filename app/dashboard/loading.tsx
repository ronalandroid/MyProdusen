export default function DashboardLoading() {
  return (
    <div className="dashboard-skeleton-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="dashboard-skeleton-hero">
        <div className="skeleton skeleton-pill w-32" />
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-line w-4/5" />
        <div className="skeleton skeleton-line w-3/5" />
      </div>

      <div className="dashboard-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="dashboard-skeleton-card" key={index}>
            <div className="skeleton skeleton-icon" />
            <div className="skeleton skeleton-line w-2/3" />
            <div className="skeleton skeleton-value" />
          </div>
        ))}
      </div>

      <div className="dashboard-skeleton-panel">
        <div className="skeleton skeleton-heading w-1/2" />
        <div className="dashboard-skeleton-bars">
          <div className="skeleton skeleton-bar h-24" />
          <div className="skeleton skeleton-bar h-32" />
          <div className="skeleton skeleton-bar h-20" />
          <div className="skeleton skeleton-bar h-36" />
          <div className="skeleton skeleton-bar h-28" />
        </div>
      </div>
      <span className="sr-only">Memuat halaman...</span>
    </div>
  );
}
