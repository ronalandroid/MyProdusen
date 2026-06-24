"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { type ClientUserProfile } from "@/lib/auth-client";
import EmployeeBeranda from "@/components/dashboard/EmployeeBeranda";

interface AdminDashboardProps {
  profile: ClientUserProfile | null;
  error: string;
  onReload: () => void;
}

export function AdminDashboard({ profile, error, onReload }: AdminDashboardProps) {
  return (
    <div className="dashboard-page animate-fade-in">
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
      <EmployeeBeranda profile={profile} />
    </div>
  );
}
