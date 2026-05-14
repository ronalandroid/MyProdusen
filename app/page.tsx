"use client";

import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  return (
    <div
      style={{
        backgroundColor: "var(--primary)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <img
          src="/logo.png"
          alt="Logo MyProdusen"
          style={{ width: "120px", height: "120px", objectFit: "contain", marginBottom: "24px" }}
        />
        
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>My</span>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF" }}>Produsen</span>
        </div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "48px" }}>
          Produsen Dimsum Medan
        </p>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", lineHeight: 1.4 }}>
          Kelola HR, Lebih Mudah<br />Lebih Cepat, Lebih Baik
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-primary)", opacity: 0.8, maxWidth: "280px" }}>
          Satu sistem untuk semua kebutuhan manajemen karyawan.
        </p>
      </div>

      <div style={{ width: "100%", paddingBottom: "24px" }}>
        <button
          onClick={() => router.push("/login")}
          className="btn"
          style={{ backgroundColor: "var(--text-primary)", color: "#FFFFFF", padding: "16px" }}
        >
          Mulai
        </button>
      </div>
    </div>
  );
}
