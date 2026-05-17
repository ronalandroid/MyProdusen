"use client";

import { ArrowLeft, Building2, ShieldCheck, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function AboutAppPage() {
  const router = useRouter();

  return (
    <main className="phone-screen feature-screen" aria-labelledby="about-title">
      <div className="flex items-center gap-3">
        <button type="button" className="icon-button" onClick={() => router.back()} aria-label="Kembali ke profil">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow">Tentang Sistem</p>
          <h1 id="about-title" className="text-xl font-bold">Tentang MyProdusen</h1>
        </div>
      </div>

      <section className="hero-card" aria-label="Ringkasan aplikasi">
        <div>
          <p className="eyebrow text-white/80">Produsen Dimsum Medan</p>
          <h2 className="text-white text-2xl font-black">MyProdusen HRIS</h2>
          <p className="text-white/90 text-sm mt-2">Sistem internal untuk kehadiran GPS, selfie attendance, cuti, KPI, laporan, notifikasi, dan audit log.</p>
        </div>
      </section>

      <section className="grid gap-3" aria-label="Fitur utama">
        <InfoCard icon={<Smartphone size={22} aria-hidden="true" />} title="Mobile friendly" text="Alur absensi dan self-service dibuat jelas untuk karyawan non-teknis." />
        <InfoCard icon={<ShieldCheck size={22} aria-hidden="true" />} title="Aman dan terkontrol" text="Akses mengikuti role, data sensitif dilindungi, aktivitas penting tercatat di audit log." />
        <InfoCard icon={<Building2 size={22} aria-hidden="true" />} title="Siap operasional" text="Mendukung HR, supervisor, dan manajemen dalam satu dashboard ringkas." />
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="card flex gap-3">
      <div className="stat-icon primary">{icon}</div>
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{text}</p>
      </div>
    </article>
  );
}
