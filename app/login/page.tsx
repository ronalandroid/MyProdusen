"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasError = Boolean(error);

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
        credentials: "include",
        body: JSON.stringify({
          email: identifier,
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Login gagal");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 lg:bg-gradient-to-br lg:from-[var(--primary-light)] lg:via-white lg:to-gray-50">
      {/* Back Button - Mobile Only */}
      <div className="lg:hidden p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </Link>
      </div>

      <section className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Branding (Desktop Only) */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="" className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-extrabold text-[var(--text-primary)]">My</span>
                  <span className="text-3xl font-extrabold text-[var(--primary)]">Produsen</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Produsen Dimsum Medan</p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold text-[var(--text-primary)] leading-tight">
                Kelola kehadiran dan tim produksi dari satu tempat
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
                Masuk dengan akun perusahaan untuk membuka dashboard, absensi, dan pengelolaan operasional.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {[
                "Absensi real-time dengan geolokasi",
                "Manajemen cuti dan izin otomatis",
                "Laporan dan analitik lengkap",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="w-6 h-6 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[var(--text-secondary)] font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 animate-scale-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-[var(--border-color)] p-6 sm:p-8 lg:p-10">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="" className="w-10 h-10" />
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-2xl font-extrabold text-[var(--text-primary)]">My</span>
                  <span className="text-2xl font-extrabold text-[var(--primary)]">Produsen</span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Produsen Dimsum Medan</p>
              </div>

              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Masuk ke Akun
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Gunakan email dan kata sandi perusahaan Anda
                </p>
              </div>

              {/* Error Alert */}
              {hasError && (
                <div
                  id="login-error"
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3 animate-fade-in"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                {/* Email Input */}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Email Perusahaan
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <Mail size={20} />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      className="
                        w-full pl-12 pr-4 py-3.5
                        text-sm font-medium
                        bg-[var(--bg-input)] text-[var(--text-primary)]
                        border-2 rounded-xl
                        transition-all duration-200
                        placeholder:text-[var(--text-muted)] placeholder:font-normal
                        focus:outline-none focus:ring-4
                        disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60
                        border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]
                      "
                      placeholder="nama@perusahaan.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="email"
                      required
                      aria-invalid={hasError}
                      aria-describedby={hasError ? "login-error" : undefined}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="login-password" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <Lock size={20} />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      className="
                        w-full pl-12 pr-12 py-3.5
                        text-sm font-medium
                        bg-[var(--bg-input)] text-[var(--text-primary)]
                        border-2 rounded-xl
                        transition-all duration-200
                        placeholder:text-[var(--text-muted)] placeholder:font-normal
                        focus:outline-none focus:ring-4
                        disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60
                        border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]
                      "
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      aria-invalid={hasError}
                      aria-describedby={hasError ? "login-error" : undefined}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="
                        absolute right-3 top-1/2 -translate-y-1/2
                        p-2 rounded-lg
                        text-[var(--text-muted)] hover:text-[var(--text-primary)]
                        hover:bg-[var(--bg-hover)]
                        transition-all duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="
                    w-full
                    bg-[var(--primary)] hover:bg-[var(--primary-hover)]
                    text-[var(--text-primary)]
                    px-6 py-4
                    rounded-xl
                    font-bold text-base
                    shadow-lg hover:shadow-xl
                    transition-all duration-200
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-light)]
                  "
                  disabled={isSubmitting || !identifier || !password}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Belum punya akun?{" "}
                  <span className="font-semibold text-[var(--text-primary)]">Hubungi HRD</span>
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
              Dengan masuk, Anda menyetujui kebijakan privasi dan syarat penggunaan kami
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
