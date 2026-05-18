"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function ActivateAccountClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Sedang mengaktifkan akun Anda.");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Token aktivasi tidak ditemukan. Silakan buka link terbaru dari email aktivasi.");
      return;
    }

    fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal aktivasi akun");
        }
        setState("success");
        setMessage("Selamat bergabung! Akun Anda sudah aktif dan tersinkron ke dashboard Superadmin.");
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Gagal aktivasi akun");
      });
  }, [token]);

  return (
    <main className="auth-page relative overflow-hidden">
      <section className="auth-shell relative z-10 !min-h-screen">
        <div className="auth-panel animate-scale-in">
          <div className="auth-card text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-[1.35rem] flex items-center justify-center shadow-lg ${state === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {state === "error" ? <XCircle size={34} aria-hidden="true" /> : <CheckCircle size={34} aria-hidden="true" />}
            </div>
            <p className="eyebrow">Aktivasi Akun</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
              {state === "loading" ? "Mengaktifkan akun..." : state === "success" ? "Selamat Bergabung" : "Aktivasi Gagal"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{message}</p>
            <div className="mt-8">
              <Link href="/login" className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-6 py-4 text-base font-bold text-[var(--text-primary)] shadow-lg shadow-yellow-300/30">
                Masuk ke MyProdusen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
