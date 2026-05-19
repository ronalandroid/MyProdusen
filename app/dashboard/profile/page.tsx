"use client";

import { ArrowLeft, Settings, ChevronRight, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientUserProfile, fetchProfile, logout } from "@/lib/auth-client";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => router.replace("/login"));
  }, [router]);

  const employee = profile?.employee;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    const confirmed = window.confirm("Keluar dari akun MyProdusen sekarang?");
    if (!confirmed) return;

    setLogoutError("");
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Gagal logout. Coba ulangi.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => router.back()}
          aria-label="Kembali"
          style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start", width: "auto", padding: 0 }}
        >
          <ArrowLeft size={24} aria-hidden="true" />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Profil</h1>
        </button>
        <Link href="/dashboard/profile/about" className="btn btn-ghost btn-icon" aria-label="Tentang aplikasi">
          <Settings size={24} color="var(--text-primary)" aria-hidden="true" />
        </Link>
      </div>

      {/* User Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="avatar" style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #FFC107 0%, #FF8F00 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 700, color: "white", borderRadius: "50%", flexShrink: 0 }}>
          {(employee?.fullName || profile?.username || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>{employee?.fullName || profile?.username || "Pengguna"}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{employee?.position || profile?.role || "-"}</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>NIP: {employee?.nip || "-"}</p>
        </div>
      </div>

      {/* Informasi Pribadi */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Informasi Pribadi</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Email</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>{employee?.email || profile?.email || "-"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No. HP</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>{employee?.phone || "-"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tanggal Lahir</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>{employee?.division || "-"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Alamat</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>{employee?.address || "-"}</span>
          </div>
        </div>
      </div>

      <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "8px 0" }} />

      {/* Menu Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Link href="/dashboard/profile/password" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "44px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Ubah Kata Sandi</span>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>
        <Link href="/dashboard/profile/notifications" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "44px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Notifikasi</span>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>
        <Link href="/dashboard/profile/about" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "44px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Tentang Aplikasi</span>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>
      </div>

      {/* Logout Button */}
      {logoutError && (
        <div role="alert" className="card" style={{ padding: "12px", color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>
          {logoutError}
        </div>
      )}

      <div className="card" style={{ marginTop: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Akun</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Keluar hanya dari perangkat ini. Anda bisa masuk kembali kapan saja.</p>
        </div>
        <button 
          className="btn btn-danger-outline" 
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          style={{ width: "100%" }}
        >
          <LogOut size={18} aria-hidden="true" />
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </div>
  );
}
