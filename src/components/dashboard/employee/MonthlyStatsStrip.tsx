"use client";

interface MonthlyStatsStripProps {
  hadir: number;
  currentStreak: number;
  currentScoreOutOfTen: string;
}

export function MonthlyStatsStrip({ hadir, currentStreak, currentScoreOutOfTen }: MonthlyStatsStripProps) {
  return (
    <section className="v4-stats-row overflow-hidden rounded-lg border border-[var(--border-color)]" aria-label="Ringkasan aktivitas bulan ini">
      <div className="v4-stat">
        <span className="v4-stat-label">Hadir</span>
        <span className="v4-stat-value">{hadir}</span>
      </div>
      <div className="v4-stat">
        <span className="v4-stat-label">Streak</span>
        <span className="v4-stat-value">{currentStreak}</span>
      </div>
      <div className="v4-stat">
        <span className="v4-stat-label">Skor</span>
        <span className="v4-stat-value mono">{currentScoreOutOfTen}<span className="text-xs font-bold text-[var(--text-muted)]">/10</span></span>
      </div>
    </section>
  );
}
