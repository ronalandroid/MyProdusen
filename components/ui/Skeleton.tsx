"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton-line rounded-lg ${className}`} aria-hidden="true" />;
}

export function SkeletonCard({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`card p-4 sm:p-5 space-y-3 ${className}`} aria-hidden="true">
      <SkeletonLine className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i === rows - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonStat({ className = "" }: { className?: string }) {
  return (
    <div className={`card p-4 ${className}`} aria-hidden="true">
      <SkeletonLine className="h-3 w-1/2 mb-3" />
      <SkeletonLine className="h-7 w-1/3" />
    </div>
  );
}

export function SkeletonList({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Memuat data...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={2} />
      ))}
    </div>
  );
}

export function SkeletonStatsGrid({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-${count} ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}
