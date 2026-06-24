"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import type { ClientUserProfile } from "@/lib/auth-client";
import type { NotificationItem } from "./types";

interface EmployeeHeaderProps {
  profile: ClientUserProfile | null;
  notifications: NotificationItem[];
  loadError: string;
  greetingTitle: string;
  displayName: string;
  initials: string;
}

export function EmployeeHeader({ profile, notifications, loadError, greetingTitle, displayName, initials }: EmployeeHeaderProps) {
  return (
    <>
      {/* Header Greeting */}
      <header className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="avatar ring-2 ring-[var(--primary)] shrink-0" style={{ width: 48, height: 48, fontSize: 18 }}>
            {profile?.employee?.profilePhoto ? (
              <Image src={profile.employee.profilePhoto} alt="" width={48} height={48} className="object-cover size-full rounded-full" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight truncate">
              {greetingTitle}, {displayName.split(" ")[0]}!
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              {profile?.employee?.position || "Karyawan"} · NIP {profile?.employee?.nip || "-"}
            </p>
          </div>
        </div>
        <Link href="/dashboard/notifications" className="icon-button shrink-0 relative bg-white border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]" aria-label="Notifikasi">
          <Bell size={20} className="text-[var(--text-primary)]" />
          {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[var(--danger)]" />}
        </Link>
      </header>

      {loadError && (
        <div className="card border-dashed border-[var(--danger)] bg-red-50/50 p-4 text-xs font-medium text-[var(--danger)]" role="alert">
          {loadError}
        </div>
      )}
    </>
  );
}
