"use client";

import Link from "next/link";
import { sizedImageSrc } from "@/lib/images/sized-image-src";
import { Bell, AlertTriangle, RefreshCcw } from "lucide-react";
import { type ClientUserProfile } from "@/lib/auth-client";
import type { DashboardStats } from "@/lib/dashboard/dashboard-types";
import { DecisionQueuePanel } from "./superadmin/DecisionQueuePanel";
import { SuperadminGamificationHub } from "./superadmin/SuperadminGamificationHub";
import { SuperadminQuickActions } from "./superadmin/SuperadminQuickActions";
import { SuperadminMonitoring } from "./superadmin/SuperadminMonitoring";

interface SuperadminDashboardProps {
  stats: DashboardStats;
  profile: ClientUserProfile | null;
  error: string;
  lastUpdated: Date | null;
  performanceSummaries: any[];
  performanceAnomalies: any[];
  onReload: () => void;
}

export function SuperadminDashboard({
  stats,
  profile,
  error,
  lastUpdated,
  performanceSummaries,
  performanceAnomalies,
  onReload,
}: SuperadminDashboardProps) {
  const displayName = profile?.employee?.fullName || profile?.username || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header */}
      <header
        className="dashboard-header superadmin-header animate-slide-up"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--text-primary)",
          backgroundImage: "url(/logo.png)",
          backgroundSize: "150px",
          backgroundPosition: "calc(100% + 50px) center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="dashboard-greeting relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Selamat Datang,
            <br />
            Super Admin!
          </h1>
          <p className="text-sm sm:text-base mt-2 max-w-[80%] font-medium">
            Operasional tertata, keputusan lebih cepat.
          </p>
          {lastUpdated && (
            <span className="last-updated mt-4 text-black/70">
              Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="dashboard-header-actions relative z-10">
          <Link href="/dashboard/notifications" className="icon-button bg-white/30 hover:bg-white/50 border-none" aria-label="Lihat notifikasi">
            <Bell size={20} aria-hidden="true" />
            {stats.unreadNotifications > 0 && <span className="notification-dot" aria-hidden="true" />}
          </Link>
          <Link href="/dashboard/profile" className="avatar avatar-link border-2 border-white" aria-label="Buka profil pengguna">
            {profile?.employee?.profilePhoto ? <img src={sizedImageSrc(profile.employee.profilePhoto, 96)} alt="" /> : initials}
          </Link>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <section className="alert-card animate-slide-up" role="alert" style={{ animationDelay: "100ms" }}>
          <AlertTriangle size={20} aria-hidden="true" />
          <div className="flex-1">
            <strong>Data belum lengkap</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReload}>
            <RefreshCcw size={14} aria-hidden="true" />
            Coba lagi
          </button>
        </section>
      )}

      <DecisionQueuePanel stats={stats} />

      <SuperadminGamificationHub
        stats={stats}
        insights={stats.superadminInsights}
        performanceSummaries={performanceSummaries}
        performanceAnomalies={performanceAnomalies}
        onReload={onReload}
      />

      <SuperadminQuickActions stats={stats} />

      {stats.superadminInsights && <SuperadminMonitoring insights={stats.superadminInsights} stats={stats} />}
    </div>
  );
}
