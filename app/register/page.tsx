"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      username: String(form.get("username") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
    };

    try {
      const response = await fetch("/api/auth/public-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Registrasi gagal");
      }

      event.currentTarget.reset();
      setSuccess("Registrasi berhasil. Tunggu aktivasi dari Superadmin atau HRD sebelum login.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[var(--primary)]/25 blur-3xl" />
        <div className="absolute -left-20 bottom-12 h-64 w-64 rounded-full bg-[var(--primary)]/15 blur-3xl" />
      </div>

      <div className="relative z-10 p-4">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Kembali ke login</span>
        </Link>
      </div>

      <section className="auth-shell relative z-10 !min-h-[calc(100dvh-64px)]">
        <div className="auth-panel animate-scale-in">
          <div className="auth-card">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-[1.35rem] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="" className="w-10 h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Daftar Akun</h1>
              <p className="text-sm text-[var(--text-secondary)]">Akun baru akan masuk status nonaktif sampai disetujui Superadmin atau HRD.</p>
            </div>

            {error && (
              <div id="register-error" role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="mb-6 p-4 rounded-2xl bg-green-50 border-2 border-green-200 text-sm font-semibold text-green-800 flex gap-2">
                <CheckCircle size={18} aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5" noValidate>
              <Field icon={<User size={20} aria-hidden="true" />} id="register-username" label="Username" name="username" placeholder="nama pengguna" autoComplete="username" disabled={isSubmitting} describedBy={error ? "register-error" : undefined} />
              <Field icon={<Mail size={20} aria-hidden="true" />} id="register-email" label="Email Perusahaan" name="email" type="email" placeholder="email@perusahaan.com" autoComplete="email" disabled={isSubmitting} describedBy={error ? "register-error" : undefined} />

              <div>
                <label htmlFor="register-password" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><Lock size={20} aria-hidden="true" /></div>
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:font-normal focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
                    placeholder="Password kuat"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    aria-describedby={error ? "register-error register-password-help" : "register-password-help"}
                    aria-invalid={Boolean(error)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                <p id="register-password-help" className="mt-2 text-xs text-[var(--text-muted)]">Wajib huruf besar, huruf kecil, angka, dan karakter khusus.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] px-6 py-4 rounded-2xl font-bold text-base shadow-lg shadow-yellow-300/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-light)]"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Daftar"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Sudah punya akun? <Link href="/login" className="font-bold text-[var(--text-primary)] hover:text-[var(--primary-dark)]">Masuk</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  icon,
  id,
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  describedBy,
}: {
  icon: React.ReactNode;
  id: string;
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  describedBy?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</div>
        <input
          id={id}
          name={name}
          type={type}
          className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:font-normal focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={Boolean(describedBy)}
        />
      </div>
    </div>
  );
}
