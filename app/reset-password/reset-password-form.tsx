"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Password gagal direset");
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Password berhasil diubah. Silakan login dengan password baru.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password gagal direset");
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
                <Image src="/logo-fast.webp" alt="" width={40} height={40} className="w-10 h-10" />
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
                Akun aman dan terlindungi
              </span>
              <h1 className="text-5xl font-extrabold text-[var(--text-primary)] leading-tight">
                Buat password baru yang kuat.
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
                Gunakan kombinasi huruf besar, kecil, angka, dan karakter khusus agar akun Anda tetap aman.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xl">
              {[
                ["Kuat", "Min. 8 karakter campuran."],
                ["Unik", "Jangan gunakan password lama."],
                ["Rahasia", "Jangan bagikan ke siapapun."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-[var(--border-color)] bg-white/80 p-4 shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--text-primary)]">
                    <Lock size={18} aria-hidden="true" />
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
                  <Lock size={30} aria-hidden="true" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Reset Kata Sandi</h1>
                <p className="text-sm text-[var(--text-secondary)]">Buat password kuat: min. 8 karakter, huruf besar, kecil, angka, dan karakter khusus.</p>
              </div>

              {!token && (
                <div role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-800">
                  Token reset tidak ditemukan. Minta link reset baru.
                </div>
              )}
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
                <PasswordField
                  id="reset-password"
                  label="Password Baru"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  disabled={isSubmitting || !token}
                />
                <PasswordField
                  id="reset-confirm-password"
                  label="Konfirmasi Password Baru"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  disabled={isSubmitting || !token}
                />

                <button
                  type="submit"
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] px-6 py-4 rounded-2xl font-bold text-base shadow-lg shadow-yellow-300/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-light)]"
                  disabled={isSubmitting || !token}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Sudah ingat password?{" "}
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

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <Lock size={20} aria-hidden="true" />
        </div>
        <input
          id={id}
          type={show ? "text" : "password"}
          className="w-full pl-12 pr-12 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:font-normal focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
          placeholder="••••••••"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          disabled={disabled}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          disabled={disabled}
        >
          {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
