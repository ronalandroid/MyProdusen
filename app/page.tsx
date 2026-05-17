"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Clock, ShieldCheck, Users } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setIsVisible(true), []);

  const features = [
    { icon: Users, title: "Terintegrasi", text: "Kelola data dan proses HR dalam satu sistem." },
    { icon: Clock, title: "Praktis", text: "Akses cepat, kapan saja dan di mana saja." },
    { icon: ShieldCheck, title: "Aman", text: "Data karyawan terlindungi dengan kontrol akses." },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFCF2] text-[var(--text-primary)]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[var(--primary)]/20 blur-3xl" />
          <div className="absolute -left-20 bottom-16 h-72 w-72 rounded-full bg-[var(--primary)]/15 blur-3xl" />
        </div>

        <div className={`relative z-10 grid flex-1 items-center gap-10 lg:grid-cols-[1fr_0.9fr] transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="MyProdusen" className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
                  My<span className="text-[var(--primary)]">Produsen</span>
                </h1>
                <p className="mt-2 text-lg font-medium text-[var(--text-muted)] sm:text-2xl">Produsen Dimsum Medan</p>
              </div>
            </div>

            <p className="max-w-xl text-lg font-medium leading-relaxed text-[var(--text-secondary)] sm:text-2xl">
              Aplikasi HRIS mobile untuk memudahkan pengelolaan karyawan, kehadiran, cuti, KPI, penggajian, dan informasi penting dalam satu genggaman.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-[24px] bg-white/80 p-4 shadow-[0_14px_40px_rgba(17,24,39,0.07)] ring-1 ring-black/5 backdrop-blur">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-black shadow-lg shadow-yellow-300/30">
                    <feature.icon size={22} strokeWidth={2.6} />
                  </div>
                  <h2 className="text-sm font-extrabold">{feature.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{feature.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-3 rounded-2xl bg-black px-7 py-4 text-sm font-bold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-neutral-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-light)]"
            >
              Mulai Sekarang
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div className="absolute -inset-6 rounded-[3rem] bg-[var(--primary)]/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[3rem] border-[10px] border-neutral-950 bg-[var(--primary)] p-6 shadow-2xl">
              <div className="mx-auto mb-8 h-6 w-28 rounded-full bg-black" />
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="" className="h-12 w-12 object-contain" />
                <div className="text-lg font-extrabold">My<span className="text-white">Produsen</span></div>
              </div>
              <div className="my-12 flex justify-center">
                <img src="/logo.png" alt="MyProdusen mascot" className="h-44 w-44 object-contain drop-shadow-2xl" />
              </div>
              <div className="rounded-[2rem] bg-white/80 p-5 text-center shadow-xl backdrop-blur">
                <CheckCircle className="mx-auto mb-3 text-[var(--success)]" size={34} />
                <h2 className="text-2xl font-extrabold">Selamat Datang Kembali</h2>
                <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">Mari bekerja lebih produktif hari ini.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
