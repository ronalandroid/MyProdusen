import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <main className="auth-page relative overflow-x-hidden">
      <section className="auth-shell relative z-10 !min-h-screen">
        <div className="auth-panel animate-scale-in">
          <div className="auth-card text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Memuat reset password...</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Mohon tunggu sebentar.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
