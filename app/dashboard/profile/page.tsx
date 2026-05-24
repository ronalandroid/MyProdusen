"use client";

import { useEffect, useState } from "react";
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
        <div
          className="avatar"
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
          }}
        >
          {employee?.profilePhoto ? <img src={employee.profilePhoto} alt="" /> : initials}
        </div>
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
          <ProfileRow label="Alamat" value={employee?.address || "-"} />
        </div>
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
