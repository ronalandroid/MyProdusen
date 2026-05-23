"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarClock, ClipboardList, Users } from "lucide-react";
import type { ClientUserProfile } from "@/lib/auth-client";

type Team = { id: string; name: string };
type LeaderPayload = { success: boolean; data?: { teams: Team[]; teamAssigned: boolean }; error?: string; message?: string };
type KpiPayload = { success: boolean; data?: Array<{ quantity: string; unit: string; date: string }>; error?: string; message?: string };

export default function LeaderBeranda({ profile }: { profile: ClientUserProfile | null }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [kpiRows, setKpiRows] = useState<Array<{ quantity: string; unit: string; date: string }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/leader/me", { credentials: "include", cache: "no-store" }).then((res) => res.json() as Promise<LeaderPayload>),
      fetch("/api/kpi/production/me", { credentials: "include", cache: "no-store" }).then((res) => res.json() as Promise<KpiPayload>),
    ]).then(([leader, kpi]) => {
      if (cancelled) return;
      if (leader.success) setTeams(leader.data?.teams || []);
      else setError(leader.error || leader.message || "Anda belum ditetapkan ke tim. Hubungi Superadmin.");
      if (kpi.success) setKpiRows(kpi.data || []);
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Beranda Leader belum lengkap.");
    });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const ownKpiToday = useMemo(() => kpiRows.filter((row) => row.date === today).reduce((sum, row) => sum + Number(row.quantity || 0), 0), [kpiRows, today]);

  return (
    <div className="space-y-4">
      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[var(--text-muted)]">Saya / Pribadi</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">Halo, {profile?.employee?.fullName || profile?.username}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Absensi GPS + selfie, KPI pribadi, cuti, notifikasi, dan slip gaji pribadi tetap tersedia.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LeaderAction href="/dashboard/attendance" icon={<CalendarClock />} label="Absensi Saya" />
            <LeaderAction href="/dashboard/kpi" icon={<BarChart3 />} label={`KPI Hari Ini: ${ownKpiToday}`} />
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[var(--text-muted)]">Tim Saya</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">{teams.length ? teams.map((team) => team.name).join(", ") : "Belum ada tim"}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Input KPI hanya untuk anggota tim yang ditetapkan Superadmin.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LeaderAction href="/dashboard/leader/kpi-input" icon={<ClipboardList />} label="Input KPI Tim" />
            <LeaderAction href="/dashboard/leader/team" icon={<Users />} label="Tim Saya" />
            <LeaderAction href="/dashboard/leader/reports" icon={<BarChart3 />} label="Laporan Tim" />
          </div>
        </div>
      </section>
    </div>
  );
}

function LeaderAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="min-h-[44px] rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm font-bold text-[var(--text-primary)] hover:border-[var(--primary)]"> <span className="mb-2 block h-5 w-5 text-[var(--primary-dark)]">{icon}</span>{label}</Link>;
}
