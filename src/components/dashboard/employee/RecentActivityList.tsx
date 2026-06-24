"use client";

import Link from "next/link";
import { notificationDateFormatter } from "./helpers";
import type { NotificationItem } from "./types";

interface RecentActivityListProps {
  notifications: NotificationItem[];
}

export function RecentActivityList({ notifications }: RecentActivityListProps) {
  return (
    <section aria-labelledby="notifications-announcement-title" className="card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-[var(--border-color)] pb-3">
        <h2 id="notifications-announcement-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
          Pengumuman & Notifikasi
        </h2>
        <Link href="/dashboard/notifications" className="text-xs font-extrabold text-[var(--primary-dark)] hover:underline">
          Lihat Semua
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--text-muted)] font-medium">
          Belum ada pengumuman baru hari ini.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((item) => (
            <Link
              key={item.id}
              href="/dashboard/notifications"
              className="flex items-start gap-3 p-2 rounded-xl transition-all hover:bg-[var(--bg-secondary)] group"
            >
              <div className={`size-2 rounded-full mt-1.5 shrink-0 ${item.read ? "bg-gray-300" : "bg-[var(--primary-dark)]"}`} />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] leading-snug group-hover:text-[var(--primary-dark)] truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5 line-clamp-1">
                  {item.message}
                </p>
                <span className="text-[9px] text-[var(--text-muted)] font-medium mt-1 block">
                  {notificationDateFormatter.format(new Date(item.createdAt))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
