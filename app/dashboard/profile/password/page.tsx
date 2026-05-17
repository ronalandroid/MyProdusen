"use client";

import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type FormState = "idle" | "loading" | "success" | "error";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      currentPassword: String(form.get("currentPassword") || ""),
      newPassword: String(form.get("newPassword") || ""),
      confirmPassword: String(form.get("confirmPassword") || ""),
    };

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setState("error");
      setMessage(result?.error || "Password gagal diubah");
      return;
    }

    event.currentTarget.reset();
    setState("success");
    setMessage("Password berhasil diubah. Gunakan password baru saat login berikutnya.");
  }

  return (
    <main className="phone-screen feature-screen" aria-labelledby="password-title">
      <div className="flex items-center gap-3">
        <button type="button" className="icon-button" onClick={() => router.back()} aria-label="Kembali ke profil">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow">Keamanan Akun</p>
          <h1 id="password-title" className="text-xl font-bold">Ubah Kata Sandi</h1>
        </div>
      </div>

      <section className="card" aria-label="Panduan password">
        <div className="flex gap-3">
          <Lock size={22} className="text-[var(--primary)]" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold">Gunakan password kuat</h2>
            <p className="text-sm text-[var(--text-secondary)]">Minimal 8 karakter, huruf besar, huruf kecil, angka, dan karakter khusus.</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4" noValidate>
        {message && (
          <div className={state === "success" ? "alert alert-success" : "alert alert-error"} role="status">
            {message}
          </div>
        )}
        <Input label="Password saat ini" name="currentPassword" type={showPassword ? "text" : "password"} required autoComplete="current-password" />
        <Input label="Password baru" name="newPassword" type={showPassword ? "text" : "password"} required autoComplete="new-password" helperText="Jangan gunakan password lama atau mudah ditebak." />
        <Input label="Konfirmasi password baru" name="confirmPassword" type={showPassword ? "text" : "password"} required autoComplete="new-password" />
        <button type="button" className="btn btn-secondary" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
          {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          {showPassword ? "Sembunyikan password" : "Tampilkan password"}
        </button>
        <Button type="submit" loading={state === "loading"} fullWidth>
          Simpan Password
        </Button>
      </form>
    </main>
  );
}
