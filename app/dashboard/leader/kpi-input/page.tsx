"use client";

import { useEffect, useMemo, useState } from "react";

type Team = { id: string; name: string };
type Member = { id: string; nip: string; fullName: string; division?: string | null; teamId: string; teamName: string };

export default function LeaderKpiInputPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leader/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.success) throw new Error(payload.error || payload.message || "Anda belum ditetapkan ke tim. Hubungi Superadmin.");
        const nextTeams = payload.data?.teams || [];
        setTeams(nextTeams);
        setTeamId(nextTeams[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal mengambil tim Leader"));
  }, []);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/leader/team-employees?teamId=${encodeURIComponent(teamId)}`, { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.success) throw new Error(payload.error || payload.message || "Gagal mengambil anggota tim");
        setMembers(payload.data || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal mengambil anggota tim"));
  }, [teamId]);

  const canSave = useMemo(() => members.some((member) => values[member.id] !== undefined && values[member.id] !== ""), [members, values]);

  async function saveAll() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const entries = members
        .filter((member) => values[member.id] !== undefined && values[member.id] !== "")
        .map((member) => ({ employeeId: member.id, teamId, date, metricType: "production_count", quantity: Number(values[member.id]), unit: "cetakan" }));
      const response = await fetch("/api/leader/kpi-production", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || payload?.message || "Gagal menyimpan KPI tim");
      setMessage("KPI tim berhasil disimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan KPI tim");
    } finally {
      setSaving(false);
    }
  }

  return <div className="dashboard-page animate-fade-in">
    <header className="dashboard-header"><div className="dashboard-greeting"><h1>Input KPI Tim</h1><p>Isi produksi harian untuk anggota tim Anda.</p></div></header>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    {message && <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div>}
    <section className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">Tanggal<input className="mt-2 w-full rounded-2xl border border-[var(--border)] p-3" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="text-sm font-bold">Tim<select className="mt-2 w-full rounded-2xl border border-[var(--border)] p-3" value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
      </div>
      <div className="mt-4 space-y-3">
        {members.length === 0 && <p className="rounded-2xl bg-[var(--bg)] p-4 text-sm font-semibold text-[var(--text-muted)]">Belum ada anggota tim. Hubungi Superadmin.</p>}
        {members.map((member) => <div key={member.id} className="grid gap-3 rounded-2xl border border-[var(--border)] p-3 md:grid-cols-[1fr_180px]">
          <div><p className="font-extrabold text-[var(--text-primary)]">{member.fullName}</p><p className="text-xs text-[var(--text-muted)]">{member.nip} • {member.division || "Divisi belum diisi"}</p></div>
          <input inputMode="decimal" className="min-h-[44px] rounded-2xl border border-[var(--border)] p-3 text-right font-bold" placeholder="0" value={values[member.id] || ""} onChange={(event) => setValues((current) => ({ ...current, [member.id]: event.target.value }))} />
        </div>)}
      </div>
      <button type="button" disabled={!canSave || saving} onClick={saveAll} className="mt-4 min-h-[44px] w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-extrabold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Semua"}</button>
    </section>
  </div>;
}
