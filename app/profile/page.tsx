import Link from "next/link";

export default function LegacyProfilePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-10">
      <section className="mx-auto max-w-md rounded-3xl border border-[var(--border-color)] bg-white p-6 shadow-sm" role="status">
        <p className="eyebrow">Akses profil</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Sesi login diperlukan</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Halaman profil berada di dashboard. Jika belum masuk, silakan login ulang untuk membuka data profil Anda.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link className="btn btn-primary" href="/login">Masuk ulang</Link>
          <Link className="btn btn-secondary" href="/dashboard/profile">Buka Profil Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
