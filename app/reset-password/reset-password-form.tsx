"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
                <Lock size={30} aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Reset Kata Sandi</h1>
              <p className="text-sm text-[var(--text-secondary)]">Buat password kuat: minimal 8 karakter, huruf besar, huruf kecil, angka, dan karakter khusus.</p>
            </div>

            {!token && <div role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-800">Token reset tidak ditemukan. Minta link reset baru.</div>}
            {error && <div role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-800">{error}</div>}
            {message && (
              <div role="status" className="mb-6 p-4 rounded-2xl bg-green-50 border-2 border-green-200 text-sm font-semibold text-green-800 flex gap-2">
                <CheckCircle size={18} aria-hidden="true" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <PasswordField id="reset-password" label="Password Baru" value={password} onChange={setPassword} show={showPassword} disabled={isSubmitting || !token} />
              <PasswordField id="reset-confirm-password" label="Konfirmasi Password Baru" value={confirmPassword} onChange={setConfirmPassword} show={showPassword} disabled={isSubmitting || !token} />
              <button type="button" className="w-full border-2 border-[var(--border-color)] bg-white px-4 py-3 rounded-2xl text-sm font-bold text-[var(--text-primary)]" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={16} aria-hidden="true" className="inline mr-2" /> : <Eye size={16} aria-hidden="true" className="inline mr-2" />}
                {showPassword ? "Sembunyikan password" : "Tampilkan password"}
              </button>
              <button type="submit" className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] px-6 py-4 rounded-2xl font-bold text-base shadow-lg shadow-yellow-300/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50" disabled={isSubmitting || !token} aria-busy={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, show, disabled }: { id: string; label: string; value: string; onChange: (value: string) => void; show: boolean; disabled: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] mb-2">{label}</label>
      <input
        id={id}
        type={show ? "text" : "password"}
        className="w-full px-4 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        disabled={disabled}
        required
      />
    </div>
  );
}
