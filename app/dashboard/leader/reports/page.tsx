"use client";

import { useEffect, useMemo, useState } from "react";

type Entry = { id: string; employeeName: string; employeeNip: string; quantity: string; unit: string; date: string };

export default function LeaderReportsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/leader/kpi-production", { credentials: "include", cache: "no-store" }).then((res) => res.json()).then((payload) => {
      if (!payload.success) throw new Error(payload.error || payload.message || "Gagal mengambil laporan tim");
      setEntries(payload.data || []);
    }).catch((err) => setError(err instanceof Error ? err.message : "Gagal mengambil laporan tim"));
  }, []);
  const total = useMemo(() => entries.reduce((sum, row) => sum + Number(row.quantity || 0), 0), [entries]);
  const average = entries.length ? total / entries.length : 0;
  return <div className="dashboard-page animate-fade-in"><header className="dashboard-header"><div className="dashboard-greeting"><h1>Laporan Kinerja</h1><p>Kinerja Saya dan Kinerja Tim dalam cakupan Leader.</p></div></header>{error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}<section className="grid gap-3 md:grid-cols-3"><div className="rounded-3xl border border-[var(--border)] bg-white p-4"><p className="text-sm font-bold text-[var(--text-muted)]">Total Produksi</p><p className="text-3xl font-extrabold">{total}</p></div><div className="rounded-3xl border border-[var(--border)] bg-white p-4"><p className="text-sm font-bold text-[var(--text-muted)]">Rata-rata</p><p className="text-3xl font-extrabold">{average.toFixed(1)}</p></div><div className="rounded-3xl border border-[var(--border)] bg-white p-4"><p className="text-sm font-bold text-[var(--text-muted)]">Missing Input</p><p className="text-3xl font-extrabold">0</p></div></section><section className="mt-4 overflow-x-auto rounded-3xl border border-[var(--border)] bg-white"><table className="min-w-full text-sm"><thead><tr className="text-left text-[var(--text-muted)]"><th className="p-3">Karyawan</th><th className="p-3">Tanggal</th><th className="p-3 text-right">Jumlah</th></tr></thead><tbody>{entries.map((row) => <tr key={row.id} className="border-t border-[var(--border)]"><td className="p-3 font-bold">{row.employeeName}<br /><span className="text-xs font-normal text-[var(--text-muted)]">{row.employeeNip}</span></td><td className="p-3">{row.date}</td><td className="p-3 text-right font-extrabold">{row.quantity} {row.unit}</td></tr>)}</tbody></table></section></div>;
}
