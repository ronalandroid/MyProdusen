"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, RefreshCw, ShieldCheck, UserCog } from "lucide-react";

type UserRole = "SUPERADMIN" | "LEADER" | "EMPLOYEE";
type Team = { id: string; name: string; active?: boolean };
type WorkLocation = { id: string; name: string; isActive?: boolean };
type Shift = { id: string; name: string; isActive?: boolean };

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  hasEmployeeProfile?: boolean;
  employeeId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  profileCompletedAt?: string | null;
  division?: string | null;
  position?: string | null;
  defaultLocationId?: string | null;
  defaultShiftId?: string | null;
  teamId?: string | null;
};

const roleLabels: Record<UserRole, string> = { SUPERADMIN: "Superadmin", LEADER: "Leader", EMPLOYEE: "Karyawan" };
function normalizeRole(role: unknown): UserRole { const value = String(role).toUpperCase(); return value === "SUPERADMIN" || value === "LEADER" ? value : "EMPLOYEE"; }
function rowsFrom(result: any) { return Array.isArray(result) ? result : result?.data || []; }

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileModalUser, setProfileModalUser] = useState<UserRow | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const loadSeq = useRef(0);

  const pendingUsers = useMemo(() => users.filter((user) => !user.isActive), [users]);

  async function fetchJson(path: string) {
    const response = await fetch(path, { credentials: "include", cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok || (!Array.isArray(result) && result?.success === false)) throw new Error(result?.error || result?.message || `Gagal mengambil ${path}`);
    return rowsFrom(result);
  }

  async function loadAll() {
    const seq = ++loadSeq.current;
    setLoading(true); setError("");
    try {
      const [userRows, teamRows, locationRows, shiftRows] = await Promise.all([
        fetchJson("/api/users"), fetchJson("/api/teams"), fetchJson("/api/work-locations?isActive=true"), fetchJson("/api/shifts?isActive=true"),
      ]);
      if (seq !== loadSeq.current) return;
      setUsers(userRows.map((row: any) => ({ ...row, role: normalizeRole(row.role) })));
      setTeams(teamRows.filter((team: Team) => team.active !== false));
      setLocations(locationRows.filter((location: WorkLocation) => location.isActive !== false));
      setShifts(shiftRows.filter((shift: Shift) => shift.isActive !== false));
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(err instanceof Error ? err.message : "Gagal mengambil data user");
    } finally { if (seq === loadSeq.current) setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  async function updateUser(user: UserRow, patch: Partial<UserRow>) {
    setSavingId(user.id); setMessage(""); setError("");
    try {
      const next = { ...user, ...patch };
      if (next.role === "LEADER" && !next.teamId) throw new Error("Leader wajib ditetapkan ke tim.");
      const response = await fetch("/api/users", {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: next.role, isActive: next.isActive, teamId: next.teamId || undefined, division: next.division || undefined, position: next.position || undefined, defaultLocationId: next.defaultLocationId || undefined, defaultShiftId: next.defaultShiftId || undefined }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || result?.message || "Gagal memperbarui user");
      await loadAll();
      setMessage("User berhasil diperbarui. Akses berubah setelah refresh atau login ulang.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui user");
    } finally { setSavingId(null); }
  }

  async function handleCreateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!profileModalUser) return;
    setIsSubmittingProfile(true); setError(""); setMessage("");
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      const response = await fetch(`/api/users/${profileModalUser.id}/employee-profile`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) throw new Error(result?.error || result?.message || "Gagal membuat profil karyawan");
      setMessage("Profil karyawan berhasil dibuat. Lanjut tetapkan role, tim, lokasi, dan shift.");
      setProfileModalUser(null); await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem"); }
    finally { setIsSubmittingProfile(false); }
  }

  return (
    <main className="phone-screen feature-screen" aria-labelledby="users-title">
      <div className="hero-card"><p className="eyebrow">Superadmin</p><h1 id="users-title">Pengguna</h1><p>Kelola role, tim/divisi, jabatan, lokasi kerja, shift, dan status aktif akun.</p></div>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><p className="text-sm font-semibold text-[var(--text-secondary)]">Total User</p><strong className="text-2xl">{users.length}</strong></div>
        <div className="card p-4"><p className="text-sm font-semibold text-[var(--text-secondary)]">Leader</p><strong className="text-2xl text-[var(--primary)]">{users.filter((u) => u.role === "LEADER").length}</strong></div>
        <div className="card p-4"><p className="text-sm font-semibold text-[var(--text-secondary)]">Belum Aktif</p><strong className="text-2xl text-[var(--warning)]">{pendingUsers.length}</strong></div>
      </section>
      <section className="card">
        <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><UserCog className="text-[var(--primary)]" size={24} aria-hidden="true" /><div><h2 className="text-base font-bold">Daftar User Terdaftar</h2><p className="text-sm text-[var(--text-secondary)]">Registrasi publik selalu Karyawan. Superadmin menetapkan role dan identitas kerja.</p></div></div><button type="button" className="icon-button" onClick={loadAll} aria-label="Muat ulang user"><RefreshCw size={18} aria-hidden="true" /></button></div>
        {message && <div className="alert alert-success mt-4" role="status"><CheckCircle size={16} aria-hidden="true" />{message}</div>}
        {error && <div className="alert alert-error mt-4" role="alert">{error}</div>}
        {loading ? <div className="empty-state-card mt-4"><p>Memuat data user...</p></div> : users.length === 0 ? <div className="empty-state-card mt-4"><p>Belum ada user terdaftar.</p></div> : (
          <div className="mt-4 flex flex-col gap-3">
            {users.map((user) => (
              <article key={user.id} className="rounded-2xl border border-[var(--border-color)] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-[var(--text-primary)]">{user.fullName || user.username}</h3><p className="text-xs text-[var(--text-secondary)]">{user.email} · {user.username}</p>{!user.hasEmployeeProfile && <p className="mt-1 text-xs font-semibold text-[var(--warning)]">Belum memiliki profil karyawan.</p>}{user.hasEmployeeProfile && !user.profileCompletedAt && <p className="mt-1 text-xs font-semibold text-[var(--warning)]">Data pribadi belum lengkap.</p>}</div><span className={`badge ${user.isActive ? "badge-success" : "badge-warning"}`}>{user.isActive ? "Aktif" : "Belum aktif"}</span></div>
                {user.hasEmployeeProfile && <div className="mt-3 grid gap-2 rounded-2xl bg-[var(--bg-main)] p-3 text-xs text-[var(--text-secondary)] sm:grid-cols-2"><p><strong className="text-[var(--text-primary)]">Nomor HP:</strong> {user.phone || "Belum diisi"}</p><p><strong className="text-[var(--text-primary)]">Alamat:</strong> {user.address || "Belum diisi"}</p></div>}
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block text-sm font-semibold">Role<select className="mt-2 w-full rounded-xl border-2 border-[var(--border-color)] bg-white px-3 py-2" value={user.role} disabled={savingId === user.id || !user.hasEmployeeProfile && user.role !== "SUPERADMIN"} onChange={(event) => updateUser(user, { role: event.target.value as UserRole })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="block text-sm font-semibold">Team / Divisi<select className="mt-2 w-full rounded-xl border-2 border-[var(--border-color)] bg-white px-3 py-2" value={user.teamId || ""} disabled={savingId === user.id || !user.hasEmployeeProfile} onChange={(event) => updateUser(user, { teamId: event.target.value })}><option value="">Belum ditetapkan</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
                  <label className="block text-sm font-semibold">Posisi / Jabatan<input className="input mt-2" value={user.position || ""} disabled={savingId === user.id || !user.hasEmployeeProfile} onChange={(event) => setUsers((rows) => rows.map((row) => row.id === user.id ? { ...row, position: event.target.value } : row))} onBlur={(event) => updateUser(user, { position: event.target.value })} placeholder="Karyawan Produksi / Leader Cetak" /></label>
                  <label className="block text-sm font-semibold">Lokasi Kerja<select className="mt-2 w-full rounded-xl border-2 border-[var(--border-color)] bg-white px-3 py-2" value={user.defaultLocationId || ""} disabled={savingId === user.id || !user.hasEmployeeProfile} onChange={(event) => updateUser(user, { defaultLocationId: event.target.value })}><option value="">Belum ditetapkan</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                  <label className="block text-sm font-semibold">Shift<select className="mt-2 w-full rounded-xl border-2 border-[var(--border-color)] bg-white px-3 py-2" value={user.defaultShiftId || ""} disabled={savingId === user.id || !user.hasEmployeeProfile} onChange={(event) => updateUser(user, { defaultShiftId: event.target.value })}><option value="">Belum ditetapkan</option>{shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</select></label>
                  <div className="flex flex-wrap items-end gap-2"><button type="button" className={user.isActive ? "btn btn-secondary" : "btn btn-primary"} disabled={savingId === user.id} onClick={() => updateUser(user, { isActive: !user.isActive })}><ShieldCheck size={16} aria-hidden="true" />{user.isActive ? "Nonaktifkan" : "Aktifkan"}</button>{!user.hasEmployeeProfile && user.role !== "SUPERADMIN" && <button type="button" className="btn btn-primary" onClick={() => setProfileModalUser(user)}>Buat Profil</button>}</div>
                </div>
                {user.role === "LEADER" && !user.teamId && <p className="mt-3 text-xs font-semibold text-[var(--warning)]">Leader belum ditetapkan ke tim.</p>}
              </article>
            ))}
          </div>
        )}
      </section>
      {profileModalUser && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/50 backdrop-blur-sm"><div className="card w-full max-w-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">Lengkapi Profil Karyawan</h3><button type="button" onClick={() => setProfileModalUser(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">&times;</button></div><form onSubmit={handleCreateProfile} className="grid gap-4"><input name="fullName" className="input" required placeholder="Nama lengkap" defaultValue={profileModalUser.username} /><input name="division" className="input" placeholder="Divisi / Team" /><input name="position" className="input" placeholder="Posisi / Jabatan" /><select name="defaultLocationId" className="input" required><option value="">Pilih lokasi kerja</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><select name="defaultShiftId" className="input" required><option value="">Pilih shift</option>{shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</select><div className="flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => setProfileModalUser(null)}>Batal</button><button type="submit" className="btn btn-primary" disabled={isSubmittingProfile}>{isSubmittingProfile ? "Menyimpan..." : "Simpan Profil"}</button></div></form></div></div>}
    </main>
  );
}
