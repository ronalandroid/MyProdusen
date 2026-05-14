"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { setToken } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: identifier,
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.data?.token) {
        throw new Error(payload.error || "Login gagal");
      }

      setToken(payload.data.token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ marginTop: "40px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
            Masuk ke <span style={{ color: "var(--primary)" }}>MyProdusen</span>
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Gunakan akun perusahaan untuk masuk.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="Masukkan email perusahaan"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: "8px" }}>
            <label className="label">Kata Sandi</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: "32px" }}>
            <a href="#" style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>
              Lupa kata sandi?
            </a>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginBottom: "24px" }}>
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
          {error && (
            <p role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "-12px", marginBottom: "16px" }}>
              {error}
            </p>
          )}
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>atau masuk dengan</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
        </div>

        <button type="button" className="btn btn-outline" style={{ gap: "12px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "auto", paddingTop: "24px" }}>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Belum punya akun? <a href="#" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>Hubungi HRD.</a>
        </p>
      </div>
    </div>
  );
}
