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
  fullName: string;
  phone: string;
  address: string;
  profilePhoto: string;
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
        {profileMe && !profileMe.profileCompleted && <ProfileCompletionModal initialFullName={profileMe.fullName} initialPhone={profileMe.phone} initialAddress={profileMe.address} initialProfilePhoto={profileMe.profilePhoto} onSaved={() => loadProfileState(true)} />}
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

async function compressAvatarImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("File avatar harus berupa gambar.");
  const bitmap = await createImageBitmap(file);
  const maxSize = 512;
  const ratio = Math.min(1, maxSize / bitmap.width, maxSize / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung kompresi avatar.");
  context.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  if (!blob) throw new Error("Gagal mengompres avatar.");
  return new File([blob], "profile-avatar.webp", { type: blob.type || "image/webp" });
}

function ProfileCompletionModal({ initialFullName, initialPhone, initialAddress, initialProfilePhoto, onSaved }: { initialFullName: string; initialPhone: string; initialAddress: string; initialProfilePhoto: string; onSaved: () => Promise<unknown> }) {
  const [fullName, setFullName] = useState(initialFullName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress || "");
  const avatarRef = useRef<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialProfilePhoto || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAvatarChange(file: File | null) {
    setError("");
    if (!file) return;
    try {
      const compressed = await compressAvatarImage(file);
      avatarRef.current = compressed;
      setAvatarPreview((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return URL.createObjectURL(compressed);
      });
    } catch (err) {
      avatarRef.current = null;
      setError(err instanceof Error ? err.message : "Gagal memproses avatar.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      if (!initialProfilePhoto && !avatarRef.current) throw new Error("Foto profil wajib diunggah.");
      if (fullName.trim().length < 3) throw new Error("Nama lengkap minimal 3 karakter.");
      const formData = new FormData();
      formData.set("fullName", fullName.trim());
      formData.set("phone", phone);
      formData.set("address", address);
      if (avatarRef.current) formData.set("avatar", avatarRef.current, avatarRef.current.name);
      const response = await fetch("/api/profile/me", { method: "PATCH", credentials: "include", body: formData });
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
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Isi foto profil, nama lengkap, nomor HP, dan alamat agar data karyawan Anda lengkap. Divisi, posisi, lokasi kerja, dan shift akan ditetapkan oleh Superadmin.</p>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <label className="text-sm font-bold text-[var(--text-primary)]">Foto profil / avatar
            <input className="input mt-2 min-h-[44px]" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)} required={!initialProfilePhoto} />
          </label>
          {avatarPreview && <img src={avatarPreview} alt="Preview avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--primary)]" />}
          <label className="text-sm font-bold text-[var(--text-primary)]">Nama Lengkap<input className="input mt-2 min-h-[44px]" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap sesuai identitas" autoComplete="name" minLength={3} required /></label>
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
