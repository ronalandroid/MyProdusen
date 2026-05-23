"use client";

import { useEffect, useState } from "react";

type Member = { id: string; nip: string; fullName: string; division?: string | null; position?: string | null; teamName: string; status: string };

export default function LeaderTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/leader/team-employees", { credentials: "include", cache: "no-store" }).then((res) => res.json()).then((payload) => {
      if (!payload.success) throw new Error(payload.error || payload.message || "Gagal mengambil tim");
      setMembers(payload.data || []);
    }).catch((err) => setError(err instanceof Error ? err.message : "Gagal mengambil tim"));
  }, []);
  return <div className="dashboard-page animate-fade-in"><header className="dashboard-header"><div className="dashboard-greeting"><h1>Tim Saya</h1><p>Anggota tim yang ditetapkan Superadmin.</p></div></header>{error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}<section className="grid gap-3 md:grid-cols-2">{members.map((member) => <article key={`${member.teamName}-${member.id}`} className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm"><p className="text-xs font-bold text-[var(--text-muted)]">{member.teamName}</p><h2 className="mt-1 text-lg font-extrabold text-[var(--text-primary)]">{member.fullName}</h2><p className="text-sm text-[var(--text-muted)]">{member.nip} • {member.division || "Divisi belum diisi"}</p><p className="mt-2 text-sm font-semibold text-[var(--success)]">{member.status}</p></article>)}</section></div>;
}
