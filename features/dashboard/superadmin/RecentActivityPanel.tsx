import Link from "next/link";
import { Clock } from "lucide-react";
import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { EmptyMiniState } from "./EmptyMiniState";

export function RecentActivityPanel({ activities }: { activities: SuperadminInsights['recentActivity'] }) {
  if (!activities) return null;
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Log Audit</p>
          <h3 className="text-base sm:text-lg">Aktivitas Sistem Terbaru</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Jejak tindakan penting dalam sistem.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--info-bg)] flex items-center justify-center">
          <Clock size={22} className="text-[var(--info)]" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-4">
        {activities.length > 0 ? activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 relative">
            <div className="mt-1 w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 relative z-10" />
            <div className="absolute left-1 top-3 bottom-[-16px] w-[1px] bg-[var(--border-color)] last:hidden" />
            <div className="pb-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold text-[var(--primary-dark)]">{activity.entity}</span>
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {new Date(activity.time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )) : <EmptyMiniState title="Belum ada aktivitas" description="Log sistem masih kosong." />}
      </div>
      {activities.length > 0 && (
        <div className="mt-2 pt-4 border-t border-[var(--border-color)] text-center">
          <Link href="/dashboard/audit" className="text-link text-xs font-semibold">Lihat Semua Log</Link>
        </div>
      )}
    </div>
  );
}
