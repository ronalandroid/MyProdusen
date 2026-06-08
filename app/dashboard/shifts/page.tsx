"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApiData } from "@/hooks/useDashboardQueries";

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export default function ShiftsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({ name: "", startTime: "", endTime: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const shiftsQuery = useQuery<Shift[]>({
    queryKey: ["shifts"],
    queryFn: () => fetchApiData<Shift[]>("/api/shifts", "Gagal mengambil data shift"),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  const shifts = shiftsQuery.data ?? [];
  const loading = shiftsQuery.isLoading;
  const loadError = shiftsQuery.error?.message || "";

  const loadShifts = useCallback(() => queryClient.invalidateQueries({ queryKey: ["shifts"] }), [queryClient]);

  function openCreateModal() {
    setEditingShift(null);
    setFormData({ name: "", startTime: "", endTime: "" });
    setMessage("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(shift: Shift) {
    setEditingShift(shift);
    setFormData({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
    setMessage("");
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(editingShift ? `/api/shifts/${editingShift.id}` : "/api/shifts", {
        method: editingShift ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Gagal menyimpan shift");
      setMessage(editingShift ? "Shift berhasil diperbarui." : "Shift berhasil dibuat.");
      setShowModal(false);
      await loadShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan shift");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleShift(shift: Shift) {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !shift.isActive }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Gagal mengubah status shift");
      setMessage("Status shift berhasil diperbarui.");
      await loadShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status shift");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">⏰ Shift Kerja</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Kelola jadwal shift karyawan dari database</p>
        </div>
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={openCreateModal}>➕ Tambah Shift</button>
      </div>

      {message && <div className="card border border-green-200 bg-green-50 p-4 text-sm text-[var(--success)]" role="status">{message}</div>}
      {(error || loadError) && (
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]" role="alert">
          {error || loadError}
          <button type="button" className="btn btn-secondary btn-sm ml-3" onClick={loadShifts}>Coba lagi</button>
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-[var(--text-secondary)]" role="status">Memuat shift...</div>
      ) : !shifts.length ? (
        <div className="card p-8 text-center text-sm text-[var(--text-secondary)]" role="status">Belum ada shift. Tambahkan shift kerja pertama.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shifts.map((shift) => (
            <div key={shift.id} className="card relative overflow-hidden p-5 sm:p-6">
              <div className="absolute left-0 right-0 top-0 h-1" style={{ background: shift.isActive ? "#22C55E" : "#5A5F78" }} />
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-bold">{shift.name}</h3>
                <span className={`badge ${shift.isActive ? "badge-success" : "badge-danger"}`}>{shift.isActive ? "Aktif" : "Nonaktif"}</span>
              </div>
              <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-[var(--radius-md)] bg-[var(--bg-input)] p-3 text-center">
                  <div className="mb-1 text-[11px] text-[var(--text-muted)]">Masuk</div>
                  <div className="font-mono text-xl font-bold text-[var(--success)]">{shift.startTime}</div>
                </div>
                <div className="text-[var(--text-muted)]">→</div>
                <div className="rounded-[var(--radius-md)] bg-[var(--bg-input)] p-3 text-center">
                  <div className="mb-1 text-[11px] text-[var(--text-muted)]">Pulang</div>
                  <div className="font-mono text-xl font-bold text-[var(--danger)]">{shift.endTime}</div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditModal(shift)}>✏️ Edit</button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={submitting} onClick={() => toggleShift(shift)}>
                  {shift.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal w-[min(92vw,520px)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{editingShift ? "✏️ Edit Shift" : "➕ Tambah Shift"}</h2>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} disabled={submitting}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="shift-name">Nama Shift</label>
                <input id="shift-name" className="input" placeholder="Contoh: Shift Pagi" required minLength={3} value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="shift-start">Jam Masuk</label>
                  <input id="shift-start" className="input" type="time" required value={formData.startTime} onChange={(event) => setFormData((current) => ({ ...current, startTime: event.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="shift-end">Jam Pulang</label>
                  <input id="shift-end" className="input" type="time" required value={formData.endTime} onChange={(event) => setFormData((current) => ({ ...current, endTime: event.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Menyimpan..." : "💾 Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
