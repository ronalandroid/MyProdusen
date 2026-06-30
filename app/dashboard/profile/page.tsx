"use client";
/* eslint-disable react-doctor/prefer-useReducer */

import { FormEvent, useEffect, useRef, useState } from "react";
import { sizedImageSrc } from "@/lib/images/sized-image-src";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { ClientUserProfile, fetchProfile, logout } from "@/lib/auth-client";
import { isFeatureEnabled } from "@/lib/features/feature-flags";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => router.replace("/login"));
  }, [router]);

  const employee = profile?.employee;
  const initials = (employee?.fullName || profile?.username || "U").charAt(0).toUpperCase();
  const roleLabel = profile?.role === "SUPERADMIN" ? "Super Admin" : "Karyawan";
  const overtimeEnabled = isFeatureEnabled("overtime");

  async function performLogout() {
    if (isLoggingOut) return;
    setLogoutError("");
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Gagal logout. Coba ulangi.");
      setIsLoggingOut(false);
    }
  }



  async function optimizeAvatar(file: File) {
    setAvatarStatus("Mengoptimalkan foto…");
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 512 / bitmap.width, 512 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak mendukung kompresi foto.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
    if (!blob) throw new Error("Gagal mengoptimalkan foto.");
    return new File([blob], "profile-avatar.webp", { type: "image/webp" });
  }

  async function handleAvatarPick(file: File | null) {
    setAvatarError("");
    if (!file) return;
    try {
      const optimized = await optimizeAvatar(file);
      setAvatarFile(optimized);
      setAvatarPreview((current) => {
        if (current.startsWith("blob:")) URL.revokeObjectURL(current);
        return URL.createObjectURL(optimized);
      });
      setAvatarStatus("Preview siap. Tekan Simpan Foto.");
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Gagal memproses foto profil.");
      setAvatarStatus("");
    }
  }

  async function saveAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !employee || !avatarFile || savingAvatar) return;
    setSavingAvatar(true);
    setAvatarError("");
    setAvatarStatus("Menyimpan foto profil…");
    try {
      const formData = new FormData();
      formData.set("fullName", employee.fullName || profile.username || "Pengguna");
      formData.set("phone", employee.phone || "081234567890");
      formData.set("address", employee.address || "Alamat belum dilengkapi");
      formData.set("avatar", avatarFile, avatarFile.name);
      const response = await fetch("/api/profile/me", { method: "PATCH", credentials: "include", body: formData, cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || "Gagal menyimpan foto profil.");
      setProfile(await fetchProfile());
      setAvatarStatus("Foto profil berhasil diperbarui.");
      setAvatarFile(null);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Gagal menyimpan foto profil.");
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-3 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-xl"
          aria-label="Kembali"
        >
          <ArrowLeft size={24} aria-hidden="true" />
          <h1 className="text-xl font-bold">Akun</h1>
        </button>
        <Link
          href="/dashboard/profile/about"
          className="btn btn-ghost btn-icon"
          aria-label="Tentang aplikasi"
        >
          <Settings size={20} aria-hidden="true" />
        </Link>
      </div>

      {/* Brand strip */}
      <section
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
          color: "var(--text-primary)",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          border: "none",
        }}
      >
        <img
          src="/logo.png"
          alt="MyProdusen"
          style={{ width: 48, height: 48, objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.18))" }}
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(17,17,17,0.7)" }}>
            MyProdusen
          </p>
          <p className="text-sm font-bold leading-tight">Produsen Dimsum Medan</p>
        </div>
      </section>

      {/* Identity */}
      <section className="flex items-center gap-4">
        <button
          type="button"
          className="avatar"
          onClick={() => { setShowPhotoModal(true); setAvatarPreview(employee?.profilePhoto || ""); }}
          aria-label="Perbarui Foto Profil"
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
            color: "var(--text-primary)",
            fontSize: 24,
            fontWeight: 700,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            minWidth: 64,
            minHeight: 64,
          }}
        >
          {employee?.profilePhoto ? <img src={sizedImageSrc(employee.profilePhoto, 256)} alt="Foto profil pengguna" /> : initials}
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-bold truncate">
            {employee?.fullName || profile?.username || "Pengguna"}
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">{employee?.position || roleLabel}</p>
          <p className="text-xs text-[var(--text-muted)]">NIP: {employee?.nip || "-"}</p>
        </div>
      </section>

      {/* Identity details */}
      <section aria-labelledby="profile-identity-title">
        <h3 id="profile-identity-title" className="text-sm font-semibold mb-3">
          Informasi Pribadi
        </h3>
        <div className="card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <ProfileRow label="Email" value={employee?.email || profile?.email || "-"} />
          <ProfileRow label="No. HP" value={employee?.phone || "-"} />
          <ProfileRow label="Divisi" value={employee?.division || "-"} />
          <ProfileRow label="Posisi" value={employee?.position || "-"} />
          <ProfileRow label="Tanggal mulai kerja" value={(profile as any)?.workStartDate ? new Date((profile as any).workStartDate).toLocaleDateString("id-ID") : "Tanggal mulai kerja belum diatur."} />
          <ProfileRow label="Masa kerja" value={(profile as any)?.workDurationLabel || "Tanggal mulai kerja belum diatur."} />
          <ProfileRow label="Proyeksi kenaikan" value="Estimasi dan membutuhkan persetujuan perusahaan." />
          <ProfileRow label="Alamat" value={employee?.address || "-"} />
        </div>
      </section>

      <section className="card" style={{ padding: "16px", display: "grid", gap: "12px" }} aria-labelledby="payroll-projection-title">
        <h3 id="payroll-projection-title" className="text-sm font-bold">Estimasi payroll & skor</h3>
        <p className="text-xs text-[var(--text-secondary)]">Gaji dasar, Bonus KPI, Potongan keterlambatan, dan Estimasi diterima hanya terlihat untuk akun sendiri dan Superadmin.</p>
        <p className="text-xs font-semibold text-[var(--text-secondary)]">Skor tahunan Anda: 100% · Estimasi kenaikan: 10%</p>
        <p className="text-xs text-[var(--text-muted)]">Proyeksi kenaikan ini bersifat estimasi dan tetap membutuhkan persetujuan perusahaan.</p>
      </section>

      <section className="card" style={{ padding: "16px", display: "grid", gap: "12px" }} aria-labelledby="chicken-streak-title">
        <h3 id="chicken-streak-title" className="text-sm font-bold">Kalender Streak Ayam</h3>
        <p className="text-xs text-[var(--text-secondary)]">🐔 Streak Hadir: 0 hari · Streak terbaik: 0 hari</p>
        <p className="text-xs text-[var(--text-muted)]">Libur dan cuti disetujui tidak memutus streak. Pertahankan streak untuk menjaga skor 100.</p>
      </section>

      {/* Menu */}
      <section aria-labelledby="profile-menu-title">
        <h3 id="profile-menu-title" className="sr-only">Menu akun</h3>
        <div className="card" style={{ padding: "8px", display: "flex", flexDirection: "column" }}>
          {profile?.role === "SUPERADMIN" && <ProfileLink href="/dashboard/users" label="Pengguna" />}
          {profile?.role === "SUPERADMIN" && <ProfileLink href="/dashboard/employees" label="Karyawan" />}
          <ProfileLink href="/dashboard/leave" label="Cuti & Saldo Cuti" />
          <ProfileLink href="/dashboard/leave/balance" label="Riwayat Saldo Cuti" />
          <ProfileLink href="/dashboard/attendance" label="Riwayat Absensi & Selfie" />
          <ProfileLink href="/dashboard/reports" label="Laporan Payroll" />
          <ProfileLink href="/dashboard/kpi" label="KPI" />
          <ProfileLink href="/dashboard/payroll" label="Gaji / Payroll" />
          {overtimeEnabled && <ProfileLink href="/dashboard/overtime" label="Pengajuan Lembur" />}
          <ProfileLink href="/dashboard/profile/password" label="Ubah Kata Sandi" />
          <ProfileLink href="/dashboard/profile/notifications" label="Notifikasi" />
          <ProfileLink href="/dashboard/profile/about" label="Tentang Aplikasi" />
        </div>
      </section>

      {/* Logout */}
      {logoutError && (
        <div role="alert" className="card" style={{ padding: "12px", color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>
          {logoutError}
        </div>
      )}

      <section className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <h3 className="text-sm font-bold">Keluar dari MyProdusen</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Anda dapat masuk kembali kapan saja dengan email dan kata sandi perusahaan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-danger-outline"
          onClick={() => setShowLogoutModal(true)}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          style={{ width: "100%" }}
        >
          <LogOut size={18} aria-hidden="true" />
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </button>
      </section>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => (!isLoggingOut ? setShowLogoutModal(false) : undefined)}
        title="Anda yakin ingin keluar?"
        size="sm"
        footer={
          <div className="modal-footer-actions">
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>
              Batal
            </Button>
            <Button variant="danger" onClick={performLogout} loading={isLoggingOut}>
              <LogOut size={16} aria-hidden="true" />
              Keluar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Sesi Anda di perangkat ini akan diakhiri. Anda bisa masuk lagi kapan saja menggunakan email perusahaan.
        </p>
      </Modal>

      <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Perbarui Foto Profil">
        <form onSubmit={saveAvatar} className="grid gap-4">
          <div className="flex items-center gap-4">
            <div className="avatar" style={{ width: 88, height: 88, overflow: "hidden" }}>{avatarPreview ? <img src={avatarPreview} alt="Preview gambar foto profil" className="h-full w-full object-cover" /> : initials}</div>
            <div className="grid gap-2">
              <button type="button" className="btn btn-secondary min-h-[44px]" onClick={() => fileInputRef.current?.click()}>Pilih Foto</button>
              <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Pilih file foto profil" onChange={(e) => handleAvatarPick(e.target.files?.[0] || null)} />
            </div>
          </div>
          {avatarStatus && <p className="text-sm font-semibold text-[var(--text-secondary)]" role="status">{avatarStatus}</p>}
          {avatarError && <div className="alert alert-error" role="alert">{avatarError}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="submit" disabled={!avatarFile || savingAvatar}>{savingAvatar ? "Menyimpan foto profil…" : "Simpan Foto"}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowPhotoModal(false)}>Batal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-xs font-medium text-[var(--text-primary)] text-right break-words" style={{ minWidth: 0 }}>
        {value}
      </span>
    </div>
  );
}

function ProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-2 py-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
      style={{ minHeight: 44 }}
    >
      <span className="text-sm font-semibold">{label}</span>
      <ChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
    </Link>
  );
}
