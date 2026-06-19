"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, KeyRound, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal mengirim email reset password");
      }

      setMessage(result.message || "Jika email terdaftar, link reset password akan dikirim.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim email reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[var(--primary)]/25 blur-3xl" />
        <div className="absolute -left-20 bottom-12 h-64 w-64 rounded-full bg-[var(--primary)]/15 blur-3xl" />
      </div>

      <div className="relative z-10 p-4">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Kembali ke login</span>
        </Link>
      </div>

      <section className="auth-shell relative z-10 !min-h-[calc(100dvh-64px)]">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:flex flex-col justify-center space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[1.35rem] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-lg">
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

            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/15 px-4 py-2 text-sm font-bold text-[var(--text-primary)] ring-1 ring-[var(--primary)]/30">
                <ShieldCheck size={16} aria-hidden="true" />
                Reset password aman
              </span>
              <h1 className="text-5xl font-extrabold text-[var(--text-primary)] leading-tight">
                Lupa kata sandi? Tenang, kami bantu.
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
                Masukkan email perusahaan Anda. Link reset kata sandi akan dikirim dalam beberapa menit dan berlaku selama 30 menit.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xl">
              {[
                ["Cepat", "Link dikirim instan ke email."],
                ["Aman", "Token kedaluwarsa 30 menit."],
                ["Mudah", "Klik dan buat password baru."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-[var(--border-color)] bg-white/80 p-4 shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--text-primary)]">
                    <KeyRound size={18} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-panel lg:mx-0 animate-scale-in">
            <div className="auth-card">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-[1.35rem] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-lg">
                  <Mail size={30} aria-hidden="true" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Lupa Kata Sandi</h1>
                <p className="text-sm text-[var(--text-secondary)]">Masukkan email perusahaan. Link reset berlaku 30 menit demi keamanan akun.</p>
              </div>

              {error && (
                <div role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-800">
                  {error}
                </div>
              )}
              {message && (
                <div role="status" className="mb-6 p-4 rounded-2xl bg-green-50 border-2 border-green-200 text-sm font-semibold text-green-800 flex gap-2">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Email Perusahaan
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <Mail size={20} aria-hidden="true" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:font-normal focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
                      placeholder="email@perusahaan.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] px-6 py-4 rounded-2xl font-bold text-base shadow-lg shadow-yellow-300/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-light)]"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Ingat kata sandi?{" "}
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center rounded-xl px-2 font-bold text-[var(--text-primary)] hover:text-[var(--primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  >
                    Masuk
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
