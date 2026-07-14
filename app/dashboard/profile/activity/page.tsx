"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, ShieldCheck } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData } from "@/hooks/useDashboardQueries";

type ActivityItem = {
  id: string;
  action: string;
  label: string;
  entity: string;
  createdAt: string;
  ipAddress: string | null;
};

const stamp = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default function MyActivityPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery<ActivityItem[]>({
    queryKey: ["me", "activity"],
    queryFn: () => fetchApiData<ActivityItem[]>("/api/me/activity", "Gagal memuat aktivitas akun"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const items = data ?? [];

  return (
    <main className="phone-screen feature-screen flex flex-col gap-5" aria-labelledby="activity-title">
      <button type="button" className="flex min-h-[44px] items-center gap-3 text-left" onClick={() => router.push("/dashboard/profile")}>
        <ArrowLeft size={24} aria-hidden="true" />
        <span id="activity-title" className="text-xl font-bold">Aktivitas Akun</span>
      </button>

      <section className="card flex items-start gap-3" role="note">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--primary-dark)]" aria-hidden="true" />
        <p className="text-sm text-[var(--text-secondary)]">
          Ini catatan aktivitas <b>akun Anda sendiri</b> — masuk, absen, perubahan data, dan lainnya. Jika ada aktivitas yang tidak Anda kenali, segera hubungi Superadmin.
        </p>
      </section>

      {isLoading ? (
        <div className="py-10 flex justify-center"><LoadingSpinner size="lg" message="Memuat aktivitas..." /></div>
      ) : error ? (
        <section className="alert-card" role="alert"><strong>Gagal</strong><p>{error instanceof Error ? error.message : "Gagal memuat aktivitas"}</p></section>
      ) : items.length === 0 ? (
        <section className="card" role="status">
          <p className="text-sm font-semibold">Belum ada aktivitas tercatat.</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Aktivitas akan muncul di sini setelah Anda mulai memakai aplikasi.</p>
        </section>
      ) : (
        <section className="card" aria-label="Daftar aktivitas">
          <ul className="flex flex-col divide-y divide-[var(--border-color)]" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary-dark)]">
                  <Activity size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {stamp.format(new Date(item.createdAt))}
                    {item.ipAddress ? ` · IP ${item.ipAddress}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
