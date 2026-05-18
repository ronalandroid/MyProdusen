import { Suspense } from "react";
import ActivateAccountClient from "./activate-account-client";

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<ActivationCard title="Memeriksa aktivasi..." message="Mohon tunggu sebentar." />}>
      <ActivateAccountClient />
    </Suspense>
  );
}

export function ActivationCard({ title, message }: { title: string; message: string }) {
  return (
    <main className="auth-page relative overflow-x-hidden">
      <section className="auth-shell relative z-10 !min-h-screen">
        <div className="auth-panel animate-scale-in">
          <div className="auth-card text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-[1.35rem] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-lg">
              <img src="/logo-fast.webp" alt="" className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">{title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{message}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
