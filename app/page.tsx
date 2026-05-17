"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, CalendarCheck, Clock, ShieldCheck, Users } from "lucide-react";

const features = [
  { icon: Users, title: "Terintegrasi", text: "Kelola data dan proses HR dalam satu sistem." },
  { icon: Clock, title: "Praktis", text: "Akses cepat, kapan saja dan di mana saja." },
  { icon: ShieldCheck, title: "Aman", text: "Data karyawan terlindungi dengan keamanan terbaik." },
];

const screens = [
  { title: "Login", subtitle: "Masuk ke MyProdusen", value: "Aman", icon: ShieldCheck },
  { title: "Dashboard", subtitle: "Ringkasan hari ini", value: "96%", icon: BarChart3 },
  { title: "Kehadiran", subtitle: "GPS + selfie", value: "Check-In", icon: CalendarCheck },
];

export default function SplashPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setIsVisible(true), []);

  return (
    <main className="landing-page text-[var(--text-primary)]">
      <section className="landing-hero">
        <div className="landing-blob landing-blob-one" />
        <div className="landing-blob landing-blob-two" />

        <div className={`landing-grid transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="landing-copy">
            <div className="brand-lockup">
              <img src="/logo.png" alt="MyProdusen" className="brand-logo" />
              <div>
                <h1 className="brand-title">My<span>Produsen</span></h1>
                <p className="brand-subtitle">Produsen Dimsum Medan</p>
              </div>
            </div>

            <p className="landing-description">
              Aplikasi HRIS mobile untuk memudahkan pengelolaan karyawan, kehadiran, cuti, penggajian, dan informasi penting lainnya dalam satu genggaman.
            </p>

            <div className="landing-feature-grid">
              {features.map((feature) => (
                <article key={feature.title} className="landing-feature-card">
                  <div className="landing-feature-icon"><feature.icon size={22} strokeWidth={2.6} aria-hidden="true" /></div>
                  <h2>{feature.title}</h2>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>

            <button type="button" onClick={() => router.push("/login")} className="landing-cta">
              Mulai Sekarang
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="hero-phone-wrap" aria-label="Preview aplikasi MyProdusen">
            <div className="phone-frame phone-frame-large">
              <div className="phone-notch" />
              <div className="phone-screen-yellow">
                <div className="phone-brand-mini">
                  <img src="/logo.png" alt="" />
                  <strong>My<span>Produsen</span></strong>
                </div>
                <img src="/logo.png" alt="Maskot MyProdusen" className="phone-mascot" />
                <div className="phone-welcome-card">
                  <h2>Selamat Datang Kembali!</h2>
                  <p>Mari bekerja lebih produktif hari ini.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="phone-gallery" aria-label="Contoh layar aplikasi">
          {screens.map((screen) => {
            const Icon = screen.icon;
            return (
              <article key={screen.title} className="mini-phone-card">
                <div className="mini-phone">
                  <div className="mini-notch" />
                  <div className="mini-phone-header">
                    <span>{screen.title}</span>
                    <Icon size={15} aria-hidden="true" />
                  </div>
                  <div className="mini-stat-card">
                    <small>{screen.subtitle}</small>
                    <strong>{screen.value}</strong>
                  </div>
                  <div className="mini-list">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <strong className="mini-label">{screen.title}</strong>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
