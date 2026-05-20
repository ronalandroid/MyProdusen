"use client";

import { ArrowLeft, Bell, Mail, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

const preferences = [
  { icon: Bell, title: "Notifikasi aplikasi", text: "Cuti, KPI, attendance exception, dan pengumuman tampil di menu Notifikasi." },
  { icon: Mail, title: "Email penting", text: "Reset password, aktivasi akun, dan perubahan akses dikirim lewat email jika Resend aktif." },
  { icon: ShieldAlert, title: "Peringatan operasional", text: "Admin menerima alert untuk kejadian penting sesuai hak akses." },
];

export default function NotificationSettingsPage() {
  const router = useRouter();

  return (
    <main className="phone-screen feature-screen" aria-labelledby="notification-title">
      <div className="flex items-center gap-3">
        <button type="button" className="icon-button" onClick={() => router.back()} aria-label="Kembali ke profil">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow">Preferensi</p>
          <h1 id="notification-title" className="text-xl font-bold">Notifikasi</h1>
        </div>
      </div>

      <section className="card" aria-label="Status preferensi">
        <h2 className="text-base font-bold">Preferensi standar aktif</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Saat ini notifikasi mengikuti role dan event penting perusahaan. Pengaturan granular bisa ditambahkan di fase berikutnya.</p>
      </section>

      <section className="card" aria-label="Daftar notifikasi saat ini">
        <h2 className="text-base font-bold">Daftar notifikasi saat ini</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Lihat notifikasi cuti, KPI, attendance exception, payroll, dan pengumuman terbaru.</p>
        <Button className="mt-4" fullWidth onClick={() => router.push("/dashboard/notifications")}>Buka Daftar Notifikasi</Button>
      </section>

      <section className="grid gap-3" aria-label="Jenis notifikasi">
        {preferences.map((item) => {
          const Icon = item.icon;
          return (
            <article className="card flex gap-3" key={item.title}>
              <div className="stat-icon primary"><Icon size={22} aria-hidden="true" /></div>
              <div>
                <h2 className="text-base font-bold">{item.title}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{item.text}</p>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
