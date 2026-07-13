"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareWarning } from "lucide-react";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import { getAuthHeaders } from "@/lib/auth-client";

type Dispute = {
  dispute: { id: string; period: string; reason: string; status: string; createdAt: string };
  employee: { id: string; fullName: string; nip: string } | null;
};

const MIN_NOTE = 5;

export default function PayrollDisputesReview() {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, isLoading } = useQuery<Dispute[]>({
    queryKey: ["payroll", "disputes", "pending"],
    queryFn: () => fetchApiData<Dispute[]>("/api/payroll/disputes?status=PENDING", "Gagal memuat aduan gaji"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const disputes = data ?? [];

  async function review(id: string, status: "RESOLVED" | "REJECTED") {
    const reviewNote = (notes[id] ?? "").trim();
    if (reviewNote.length < MIN_NOTE) {
      setFeedback({ type: "error", message: `Catatan keputusan minimal ${MIN_NOTE} karakter.` });
      return;
    }
    setBusy(`${id}-${status}`);
    setFeedback(null);
    try {
      const response = await fetch(`/api/payroll/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ status, reviewNote }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Gagal memproses aduan");
      setFeedback({ type: "success", message: payload.message || "Aduan diproses." });
      await queryClient.invalidateQueries({ queryKey: ["payroll", "disputes"] });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Gagal memproses aduan" });
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) return null;

  return (
    <section className="card" aria-label="Aduan ketidaksesuaian gaji">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquareWarning size={18} className="text-amber-600" aria-hidden="true" />
        <h2 className="text-base font-bold">Aduan Gaji Menunggu Review</h2>
        {disputes.length > 0 && <span className="badge badge-warning">{disputes.length}</span>}
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">Karyawan mengadukan ketidaksesuaian gaji. Cross-check lalu setujui atau tolak — keputusan dikirim ke akun karyawan.</p>

      {feedback && (
        <div role={feedback.type === "error" ? "alert" : "status"} className={`mb-3 rounded-2xl border p-3 text-xs font-semibold ${feedback.type === "success" ? "bg-green-50 border-green-200 text-[var(--success)]" : "bg-red-50 border-red-200 text-[var(--danger)]"}`}>
          {feedback.message}
        </div>
      )}

      {disputes.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]" role="status">Tidak ada aduan yang menunggu. 🎉</p>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map(({ dispute, employee }) => (
            <article key={dispute.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm font-bold">{employee?.fullName ?? "Karyawan"} <span className="font-normal text-[var(--text-secondary)]">· slip {dispute.period}</span></p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">“{dispute.reason}”</p>
              <label className="mt-3 block text-xs font-extrabold text-[var(--text-secondary)]" htmlFor={`note-${dispute.id}`}>Catatan keputusan</label>
              <textarea
                id={`note-${dispute.id}`}
                className="mt-1 w-full rounded-2xl border border-[var(--border-color)] p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                rows={2}
                maxLength={500}
                value={notes[dispute.id] ?? ""}
                onChange={(event) => setNotes((prev) => ({ ...prev, [dispute.id]: event.target.value }))}
                placeholder="Contoh: benar, lembur belum terhitung — selisih dibayar tunai minggu ini."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" disabled={busy !== null} onClick={() => review(dispute.id, "RESOLVED")}>
                  {busy === `${dispute.id}-RESOLVED` ? "Memproses…" : "Setujui"}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={busy !== null} onClick={() => review(dispute.id, "REJECTED")}>
                  {busy === `${dispute.id}-REJECTED` ? "Memproses…" : "Tolak"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
