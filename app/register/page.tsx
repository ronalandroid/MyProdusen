"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Building2, CheckCircle, ContactRound, Eye, EyeOff, Lock, Mail, ShieldCheck, User, UserCheck } from "lucide-react";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Lemah", color: "var(--danger)" };
  if (score <= 3) return { score, label: "Sedang", color: "var(--warning)" };
  return { score, label: "Kuat", color: "var(--success)" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availability, setAvailability] = useState<{ username?: string; email?: string }>({});

  async function checkAvailability(field: "username" | "email", value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setAvailability((current) => ({ ...current, [field]: undefined }));
      return;
    }
    try {
      const res = await fetch(`/api/auth/register-availability?${field}=${encodeURIComponent(trimmed)}`);
      const payload = await res.json();
      const taken = field === "username" ? payload?.data?.usernameTaken : payload?.data?.emailTaken;
      setAvailability((current) => ({
        ...current,
        [field]: taken ? (field === "username" ? "Username sudah dipakai — coba yang lain ya." : "Email sudah terdaftar. Sudah punya akun? Silakan masuk.") : undefined,
      }));
    } catch {
      setAvailability((current) => ({ ...current, [field]: undefined }));
    }
  }

  const [options, setOptions] = useState<{ divisions: string[]; positions: string[]; leaders: Array<{ id: string; fullName: string; division: string | null }> }>({ divisions: [], positions: [], leaders: [] });
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/register-options")
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled && payload?.success && payload.data) {
          setOptions(payload.data);
          setIsRegistrationOpen(payload.data.registrationOpen !== false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const form = new FormData(formElement);
    const payload = {
      username: String(form.get("username") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
      fullName: String(form.get("fullName") || "").trim(),
      division: String(form.get("division") || "").trim(),
      position: String(form.get("position") || "").trim(),
      supervisorId: String(form.get("supervisorId") || "").trim(),
      website: String(form.get("website") || ""),
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

      formElement.reset();

      // Riset UX (NN/g, Baymard): jangan lempar user kembali ke halaman login
      // setelah daftar — masukkan langsung ke aplikasi.
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      }).catch(() => null);
      const loginResult = loginResponse ? await loginResponse.json().catch(() => null) : null;

      if (loginResponse?.ok && loginResult?.success) {
        setSuccess("Akun Anda langsung aktif! Sebentar ya, kami antar ke beranda…");
        router.replace("/dashboard");
        return;
      }

      setSuccess("Akun Anda langsung aktif! Silakan masuk dan mulai absen hari ini juga.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
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
        <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
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
                Pendaftaran internal aman
              </span>
              <h1 className="text-5xl font-extrabold text-[var(--text-primary)] leading-tight">
                Mulai kelola HR, kehadiran, dan KPI dalam satu sistem
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
                Buat akun sekali jalan — langsung aktif dan bisa absen hari ini juga. Superadmin memverifikasi data Anda belakangan.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xl">
              {[
                ["Terintegrasi", "Data HR dalam satu sistem."],
                ["Praktis", "Akses cepat kapan saja."],
                ["Langsung Aktif", "Daftar dan absen hari ini juga."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-[var(--border-color)] bg-white/80 p-4 shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--text-primary)]">
                    <CheckCircle size={18} aria-hidden="true" />
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
                <Image src="/logo-fast.webp" alt="" width={40} height={40} className="w-10 h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Daftar Akun</h1>
              <p className="text-sm text-[var(--text-secondary)]">Isi data singkat di bawah — akun langsung aktif dan siap dipakai absen.</p>
            </div>

            {error && (
              <div id="register-error" role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="mb-6 p-4 rounded-2xl bg-green-50 border-2 border-green-200 text-sm font-semibold text-green-800 flex gap-2">
                <CheckCircle size={18} aria-hidden="true" />
                <span>
                  {success}{" "}
                  <Link href="/login" className="font-bold underline underline-offset-2">Masuk sekarang</Link>
                </span>
              </div>
            )}

            {!isRegistrationOpen && (
              <div role="status" className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center space-y-2">
                <p className="text-base font-bold text-amber-900">Pendaftaran sedang ditutup</p>
                <p className="text-sm font-medium text-amber-800">
                  Perusahaan sedang tidak menerima pendaftaran akun baru. Hubungi HRD/Superadmin agar akun Anda dibuatkan langsung.
                </p>
              </div>
            )}

            {isRegistrationOpen && (
            <form onSubmit={handleRegister} className="space-y-5" noValidate>
              {/* Honeypot anti-bot: tersembunyi dari manusia, diisi oleh bot. */}
              <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="register-website">Website</label>
                <input id="register-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <Field icon={<User size={20} aria-hidden="true" />} id="register-username" label="Username" name="username" placeholder="nama pengguna" autoComplete="username" disabled={isSubmitting} describedBy={error ? "register-error" : undefined} hint={availability.username} onBlurValue={(value) => checkAvailability("username", value)} />
              <Field icon={<Mail size={20} aria-hidden="true" />} id="register-email" label="Email Perusahaan" name="email" type="email" placeholder="email@perusahaan.com" autoComplete="email" disabled={isSubmitting} describedBy={error ? "register-error" : undefined} hint={availability.email} onBlurValue={(value) => checkAvailability("email", value)} />
              <p className="-mt-3 text-xs text-[var(--text-muted)]">Slip gaji dan info penting dikirim ke email ini.</p>
              <Field icon={<ContactRound size={20} aria-hidden="true" />} id="register-fullname" label="Nama Lengkap" name="fullName" placeholder="Nama sesuai identitas" autoComplete="name" disabled={isSubmitting} describedBy={error ? "register-error" : undefined} />

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  icon={<Building2 size={20} aria-hidden="true" />}
                  id="register-division"
                  label="Divisi (opsional)"
                  name="division"
                  disabled={isSubmitting}
                  placeholderOption="Pilih divisi"
                  options={options.divisions.map((division) => ({ value: division, label: division }))}
                />
                <div>
                  <label htmlFor="register-position" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Posisi (opsional)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><Briefcase size={20} aria-hidden="true" /></div>
                    <input
                      id="register-position"
                      name="position"
                      type="text"
                      list="register-position-options"
                      className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:font-normal focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
                      placeholder="cth: Operator Cetak"
                      autoComplete="organization-title"
                      disabled={isSubmitting}
                    />
                    <datalist id="register-position-options">
                      {options.positions.map((position) => (
                        <option key={position} value={position} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <SelectField
                icon={<UserCheck size={20} aria-hidden="true" />}
                id="register-supervisor"
                label="Atasan Langsung / Leader (opsional)"
                name="supervisorId"
                disabled={isSubmitting}
                placeholderOption="Pilih leader Anda"
                options={options.leaders.map((leader) => ({ value: leader.id, label: leader.division ? `${leader.fullName} — ${leader.division}` : leader.fullName }))}
              />

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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={error ? "register-error register-password-help" : "register-password-help"}
                    aria-invalid={Boolean(error)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                {password && (() => {
                  const { score, label, color } = getPasswordStrength(password);
                  return (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1" aria-hidden="true">
                        {[1,2,3,4,5].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= score ? color : "var(--border-color)" }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-semibold" style={{ color }}>
                        Kekuatan: {label}
                      </p>
                    </div>
                  );
                })()}
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
            )}

            <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Sudah punya akun? <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl px-2 font-bold text-[var(--text-primary)] hover:text-[var(--primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Masuk</Link>
              </p>
            </div>
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
  hint,
  onBlurValue,
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
  hint?: string;
  onBlurValue?: (value: string) => void;
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
          aria-invalid={Boolean(describedBy) || Boolean(hint)}
          onBlur={onBlurValue ? (event) => onBlurValue(event.target.value) : undefined}
        />
      </div>
      {hint && <p role="status" className="mt-1.5 text-xs font-semibold text-[var(--danger)]">{hint}</p>}
    </div>
  );
}

function SelectField({
  icon,
  id,
  label,
  name,
  disabled,
  placeholderOption,
  options,
}: {
  icon: React.ReactNode;
  id: string;
  label: string;
  name: string;
  disabled: boolean;
  placeholderOption: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</div>
        <select
          id={id}
          name={name}
          defaultValue=""
          disabled={disabled || options.length === 0}
          className="w-full appearance-none pl-12 pr-4 py-3.5 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
        >
          <option value="">{options.length === 0 ? "Belum ada pilihan — lewati saja" : placeholderOption}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
