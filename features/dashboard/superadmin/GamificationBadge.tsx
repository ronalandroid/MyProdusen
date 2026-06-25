export function GamificationBadge({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: "success" | "warning" | "info" }) {
  return (
    <article className={`gamification-badge gamification-badge-${tone}`} role="listitem">
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="progress-track" aria-label={`${label} progress ${progress}%`}>
        <i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </article>
  );
}
