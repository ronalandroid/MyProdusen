"use client";

import { RefreshCcw } from "lucide-react";
import { type ClientUserProfile } from "@/lib/auth-client";
import LeaderBeranda from "@/components/dashboard/LeaderBeranda";

interface LeaderDashboardProps {
  profile: ClientUserProfile | null;
  onReload: () => void;
}

export function LeaderDashboard({ profile, onReload }: LeaderDashboardProps) {
  return (
    <div className="dashboard-page animate-fade-in">
      <header className="dashboard-header animate-slide-up">
        <div className="dashboard-greeting">
          <p className="dashboard-date">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1>Beranda Leader</h1>
          <p>Absensi pribadi dan KPI tim dalam satu tempat.</p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReload}>
            <RefreshCcw size={14} aria-hidden="true" />
            Muat ulang
          </button>
        </div>
      </header>
      <LeaderBeranda profile={profile} />
    </div>
  );
}
