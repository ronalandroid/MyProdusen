"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";

type PayrollItem = { item: { id: string; netPay: number; grossPay: number; totalDeductions: number }; run: { period: string; status: string } };

const MIN_REASON = 10;

function money(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

export default function MyPayrollPage() {
  const router = useRouter();
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openDisputeFor, setOpenDisputeFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  async function submitDispute(payrollItemId: string) {
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/payroll/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ payrollItemId, reason: reason.trim() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Gagal mengirim aduan");
      setFeedback({ type: "success", message: payload.message || "Aduan terkirim." });
      setOpenDisputeFor(null);
      setReason("");
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Gagal mengirim aduan" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen message="Memuat slip gaji pribadi..." />;

  return (
    <main className="phone-screen feature-screen flex flex-col gap-5" aria-labelledby="my-payroll-title">
      <button type="button" className="flex min-h-[44px] items-center gap-3 text-left" onClick={() => router.push("/dashboard/payroll")}>
        <ArrowLeft size={24} aria-hidden="true" />
        <span id="my-payroll-title" className="text-xl font-bold">Slip Gaji Saya</span>
      </button>
      {error && <section className="alert-card" role="alert"><strong>Gagal</strong><p>{error}</p></section>}
      {feedback && (
        <section role={feedback.type === "error" ? "alert" : "status"} className={`rounded-2xl border p-4 text-sm font-semibold ${feedback.type === "success" ? "bg-green-50 border-green-200 text-[var(--success)]" : "bg-red-50 border-red-200 text-[var(--danger)]"}`}>
          {feedback.message}
        </section>
      )}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <a className="btn btn-primary" href={`/api/payroll/payslips/${item.id}`}>Download Payslip</a>
                  <button
                    type="button"
                    className="btn btn-secondary inline-flex items-center gap-1.5"
                    onClick={() => { setOpenDisputeFor(openDisputeFor === item.id ? null : item.id); setReason(""); setFeedback(null); }}
                    aria-expanded={openDisputeFor === item.id}
                  >
                    <MessageSquareWarning size={16} aria-hidden="true" />
                    Adukan Ketidaksesuaian
                  </button>
                </div>
                {openDisputeFor === item.id && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 animate-fade-in">
                    <label className="text-xs font-extrabold text-amber-800" htmlFor={`dispute-${item.id}`}>
                      Jelaskan bagian gaji yang menurut Anda keliru
                    </label>
                    <textarea
                      id={`dispute-${item.id}`}
                      className="mt-2 w-full rounded-2xl border border-amber-200 p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      rows={3}
                      maxLength={500}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Contoh: lembur tanggal 12 Juni belum masuk, atau potongan kasbon terlihat dobel."
                    />
                    <p className="mt-1 text-[10px] font-semibold text-amber-700">Superadmin akan cross-check lalu mengabari Anda. Minimal {MIN_REASON} karakter.</p>
                    <button
                      type="button"
                      className="btn btn-primary mt-2"
                      disabled={submitting || reason.trim().length < MIN_REASON}
                      onClick={() => submitDispute(item.id)}
                    >
                      {submitting ? "Mengirim…" : "Kirim Aduan"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
