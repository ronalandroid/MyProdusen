"use client";

import { ArrowLeft, Settings, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientUserProfile, fetchProfile, logout } from "@/lib/auth-client";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => router.replace("/login"));
  }, [router]);

  const employee = profile?.employee;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Profil</h1>
        </div>
        <Settings size={24} color="var(--text-primary)" />
      </div>

      {/* User Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="avatar" style={{ width: "64px", height: "64px" }}>
          <img src="/logo.png" alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Ubah Kata Sandi</span>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Notifikasi</span>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Tentang Aplikasi</span>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      </div>

      {/* Logout Button */}
      <div style={{ marginTop: "24px" }}>
        <button 
          className="btn btn-danger-outline" 
          onClick={handleLogout}
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
