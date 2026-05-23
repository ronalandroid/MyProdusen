"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { fetchProfile, logout } from "@/lib/auth-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ToastProvider } from "@/components/ui/Toast";
import { canAccessNavigationPath } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/lib/permissions";
import type { ClientUserProfile } from "@/lib/auth-client";

type ProfileMe = {
  role: UserRole;
  phone: string;
  address: string;
  profileCompleted: boolean;
  assignmentStatus: { hasDivision: boolean; hasPosition: boolean; hasLocation: boolean; hasShift: boolean; hasTeam: boolean };
};

const missingMessages = {
  hasDivision: "Divisi belum ditetapkan. Hubungi Superadmin.",
  hasPosition: "Posisi belum ditetapkan. Hubungi Superadmin.",
  hasLocation: "Lokasi kerja belum tersedia. Hubungi Superadmin.",
  hasShift: "Shift belum tersedia. Hubungi Superadmin.",
  hasTeam: "Anda belum ditetapkan ke tim. Hubungi Superadmin.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const contentRef = useRef<HTMLElement | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [profileMe, setProfileMe] = useState<ProfileMe | null>(null);
  const [syncNotice, setSyncNotice] = useState("");

  async function loadProfileState(showSyncNotice = false) {
    const [sessionProfile, meResponse] = await Promise.all([
      fetchProfile(),
      fetch("/api/profile/me", { credentials: "include", cache: "no-store" }),
    ]);
    const mePayload = await meResponse.json().catch(() => null);
    if (!meResponse.ok || !mePayload?.success) throw new Error(mePayload?.error?.message || "Sesi tidak valid");
    setProfile((current) => {
      if (showSyncNotice && current && current.role !== sessionProfile.role) setSyncNotice("Data pekerjaan Anda telah diperbarui.");
      return sessionProfile;
    });
    setProfileMe(mePayload.data);
    return { sessionProfile, profileMe: mePayload.data as ProfileMe };
  }

  useEffect(() => {
    loadProfileState()
      .then(({ sessionProfile }) => {
        if (!canAccessNavigationPath(sessionProfile.role as UserRole, pathname)) {
          setIsCheckingSession(false);
          router.replace("/dashboard");
          return;
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        setIsCheckingSession(false);
        router.replace("/login");
      });
  }, [pathname, router]);

  useEffect(() => {
    const refresh = () => loadProfileState(true).catch(() => undefined);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  if (isCheckingSession) return <div className="dashboard-auth-loading" role="status" aria-live="polite" aria-busy="true"><div className="dashboard-auth-card"><img src="/logo.png" alt="MyProdusen" className="h-16 w-16 object-contain" /><LoadingSpinner size="lg" message="Memeriksa sesi..." /><p className="text-xs text-[var(--text-muted)]">Menyiapkan dashboard aman Anda.</p></div></div>;
  if (!profile) return null;

  return (
    <ToastProvider>
      <div className="layout-wrapper">
        <a href="#dashboard-content" className="skip-link">Lewati navigasi</a>
        <nav className="nav-container" aria-label="Navigasi utama"><Sidebar role={profile.role as UserRole} /></nav>
        <main id="dashboard-content" ref={contentRef} className="mobile-content" tabIndex={-1}>
          {syncNotice && <div className="alert alert-success mb-4" role="status">{syncNotice}</div>}
          {profileMe && profile.role !== "SUPERADMIN" && <AssignmentStatusCards profileMe={profileMe} />}
          {children}
        </main>
        {profileMe && !profileMe.profileCompleted && <ProfileCompletionModal initialPhone={profileMe.phone} initialAddress={profileMe.address} onSaved={() => loadProfileState(true)} />}
      </div>
    </ToastProvider>
  );
}

function AssignmentStatusCards({ profileMe }: { profileMe: ProfileMe }) {
  const missing = Object.entries(profileMe.assignmentStatus).filter(([key, value]) => {
    if (profileMe.role !== "LEADER" && key === "hasTeam") return false;
    return !value;
  });
  if (missing.length === 0) return null;
  return <section className="mb-4 grid gap-3 sm:grid-cols-2" aria-label="Status data pekerjaan">{missing.map(([key]) => <div key={key} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{missingMessages[key as keyof typeof missingMessages]}</div>)}</section>;
}

function ProfileCompletionModal({ initialPhone, initialAddress, onSaved }: { initialPhone: string; initialAddress: string; onSaved: () => Promise<unknown> }) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      const response = await fetch("/api/profile/me", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, address }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || "Gagal menyimpan data pribadi");
      setSuccess("Data pribadi berhasil disimpan.");
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data pribadi");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-onboarding-title">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl sm:p-6">
        <h2 id="profile-onboarding-title" className="text-xl font-extrabold text-[var(--text-primary)]">Lengkapi Data Pribadi</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Isi nomor HP dan alamat agar data karyawan Anda lengkap. Divisi, posisi, lokasi kerja, dan shift akan ditetapkan oleh Superadmin.</p>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <label className="text-sm font-bold text-[var(--text-primary)]">Nomor HP<input className="input mt-2 min-h-[44px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" autoComplete="tel" required /></label>
          <label className="text-sm font-bold text-[var(--text-primary)]">Alamat lengkap<textarea className="input mt-2 min-h-[116px] resize-y" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap tempat tinggal" required /></label>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="status">{success}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="submit" className="btn btn-primary min-h-[44px]" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Data"}</button>
            <button type="button" className="btn btn-secondary min-h-[44px]" onClick={() => logout()} disabled={saving}>Keluar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
