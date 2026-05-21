"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type PayrollItem = { item: { id: string; netPay: number; grossPay: number; totalDeductions: number }; run: { period: string; status: string } };

function money(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

export default function MyPayrollPage() {
  const router = useRouter();
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/payroll/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) throw new Error(payload?.error || "Gagal memuat slip gaji pribadi");
        setItems(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat slip gaji pribadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Memuat slip gaji pribadi..." />;

  return (
    <main className="phone-screen feature-screen flex flex-col gap-5" aria-labelledby="my-payroll-title">
      <button type="button" className="flex min-h-[44px] items-center gap-3 text-left" onClick={() => router.push("/dashboard/payroll")}>
        <ArrowLeft size={24} aria-hidden="true" />
        <span id="my-payroll-title" className="text-xl font-bold">Slip Gaji Saya</span>
      </button>
      <section className="sync-strip" aria-label="Alur data slip gaji pribadi">
        <span>Frontend</span><span aria-hidden="true">→</span><span>/api/payroll/me</span><span aria-hidden="true">→</span><span>Payroll Service</span><span aria-hidden="true">→</span><span>Drizzle</span><span aria-hidden="true">→</span><span>PostgreSQL</span>
      </section>
      <section className="card" aria-labelledby="my-payroll-sync-title" style={{ borderColor: "rgba(59,130,246,.32)" }}>
        <p className="eyebrow">Private Payslip</p>
        <h2 id="my-payroll-sync-title" className="text-lg font-bold">Download aman dan ter-audit</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Payslip hanya untuk pemilik akun atau Superadmin. Response memakai no-store dan `nosniff`.</p>
        <div className="mt-3 flex flex-wrap gap-2"><span className="api-pill">API: /api/payroll/me</span><span className="api-pill">API: /api/payroll/payslips/:itemId</span></div>
      </section>
      {error && <section className="alert-card" role="alert"><strong>Gagal</strong><p>{error}</p></section>}
      {items.length === 0 ? (
        <section className="card" role="status">
          <h2 className="text-base font-bold">Payslip belum dipublikasikan</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Slip gaji pribadi akan tampil setelah payroll disetujui dan diterbitkan. Data karyawan lain tidak ditampilkan.</p>
        </section>
      ) : (
        <section className="card">
          <h2 className="text-base font-bold mb-3">Daftar Payslip Pribadi</h2>
          <div className="flex flex-col gap-3">
            {items.map(({ item, run }) => (
              <article key={item.id} className="rounded-2xl border border-[var(--border-color)] p-4">
                <p className="font-bold">Slip gaji {run.period}</p>
                <p className="text-sm text-[var(--text-secondary)]">Status {run.status} · Net {money(item.netPay)}</p>
                <a className="btn btn-primary mt-3" href={`/api/payroll/payslips/${item.id}`}>Download Payslip</a>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
