import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  Sparkles,
  BadgeCheck,
  Leaf,
  Handshake,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Terintegrasi",
    desc: "Absensi, KPI, cuti, dan penggajian terpusat dalam satu sistem yang rapi.",
  },
  {
    icon: Clock,
    title: "Praktis & Cepat",
    desc: "Akses kehadiran, slip gaji, dan pengajuan kapan saja, di mana saja.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Terpercaya",
    desc: "Data karyawan terlindungi dengan standar keamanan modern.",
  },
];

const MISI_POINTS = [
  { icon: BadgeCheck, text: "Menyediakan produk dimsum beku berkualitas tinggi secara konsisten." },
  { icon: ShieldCheck, text: "Menjaga standar kebersihan dan keamanan pangan yang tinggi." },
  { icon: Sparkles, text: "Terus berinovasi dalam pengembangan produk." },
  { icon: Handshake, text: "Menjalin kemitraan strategis yang saling menguntungkan." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#111111] overflow-x-hidden flex flex-col selection:bg-[#FFC107]/30">
      {/* Ambient background */}
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-full w-1/2 rounded-full bg-[#FFC107]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-1/2 w-1/3 rounded-full bg-[#FFC107]/10 blur-[120px]" />

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo-fast.webp" alt="MyProdusen" width={56} height={56} className="h-12 w-12 object-contain lg:h-14 lg:w-14" priority />
          <div className="flex flex-col">
            <span className="text-xl font-black leading-none tracking-tight lg:text-2xl">
              My<span className="text-[#F5A800]">Produsen</span>
            </span>
            <span className="mt-0.5 text-xs font-semibold tracking-wide text-[#6B6B6B]">Produsen Dimsum Beku Premium</span>
          </div>
        </div>
        <Link
          href="/login"
          className="hidden items-center justify-center rounded-full bg-[#111111] px-6 py-3 font-bold text-white shadow-lg shadow-black/10 transition-transform hover:bg-black/85 active:scale-95 sm:inline-flex"
        >
          Masuk Sistem
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#FFC107]/40 bg-[#FFC107]/15 px-4 py-2 text-sm font-bold text-[#8A6D00] lg:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFC107] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F5A800]" />
            </span>
            Platform Operasional Internal · TBM Group
          </div>

          <h1 className="mb-6 text-[34px] font-black leading-[1.12] tracking-tight sm:text-[42px] lg:text-[52px]">
            Kelola seluruh operasional tim dalam{" "}
            <span className="relative whitespace-nowrap inline-block after:absolute after:bottom-1 after:left-0 after:-z-10 after:h-3 after:w-full after:bg-[#FFC107]/40">
              satu sistem.
            </span>
          </h1>

          <p className="mb-8 max-w-lg text-base font-medium leading-relaxed text-[#5A5A5A] sm:text-lg">
            Absensi, KPI, penggajian, hingga manajemen karyawan — efisien, akurat,
            dan aman. Dirancang untuk mendukung produksi dimsum beku premium yang berkelanjutan.
          </p>

          <div className="mb-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFC107] px-7 py-4 text-lg font-black text-[#111111] shadow-[0_10px_28px_rgba(255,193,7,0.35)] transition-transform hover:bg-[#FFCA28] active:scale-95"
            >
              Masuk Sistem <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 lg:gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4C6] text-[#F5A800]">
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-[#6B6B6B]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative mt-4 flex justify-center lg:mt-0 lg:justify-end">
          <div className="group relative flex h-[580px] w-[280px] flex-col overflow-hidden rounded-[48px] border-[8px] border-[#111111] bg-[#111111] shadow-[0_24px_80px_rgba(17,17,17,0.22)] transition-transform duration-500 hover:rotate-0 sm:h-[650px] sm:w-[320px] lg:-rotate-2">
            <div className="absolute inset-x-0 top-0 z-20 mx-auto h-6 w-32 rounded-b-[16px] bg-[#111111]" />
            <div className="relative flex flex-1 flex-col items-center justify-center bg-[#FFC107] p-6">
              <div className="absolute left-6 top-8 flex items-center gap-2">
                <Image src="/logo-fast.webp" width={28} height={28} alt="Logo" className="h-7 w-7" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black leading-tight text-[#111111]">My<span className="text-white">Produsen</span></span>
                  <span className="text-[6px] font-bold text-[#111111]">Produsen Dimsum Medan</span>
                </div>
              </div>

              <Image src="/logo-fast.webp" width={160} height={160} alt="MyProdusen mascot" className="mt-12 w-32 drop-shadow-xl transition-transform duration-700 group-hover:scale-105 sm:w-40" />

              <div className="mt-auto w-full pb-8">
                <h3 className="text-center text-[22px] font-black leading-tight tracking-tight text-[#111111] sm:text-2xl">
                  Operasional Tertata,<br />Keputusan Lebih Cepat
                </h3>
                <p className="mt-3 px-2 text-center text-xs font-bold text-[#111111]/70">
                  Satu sistem untuk seluruh kebutuhan manajemen tim.
                </p>
                <div className="mb-8 mt-6 flex justify-center gap-1.5">
                  <div className="h-1.5 w-6 rounded-full bg-[#111111]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#111111]/20" />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#111111]/20" />
                </div>
                <Link href="/login" className="block w-full rounded-[12px] bg-[#111111] py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-black/85">
                  Mulai
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 top-20 -z-10 h-24 w-24 rounded-full bg-[#FFC107] opacity-50 blur-[40px]" />
        </div>
      </main>

      {/* Visi & Misi */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <div className="mb-10 text-center lg:mb-14">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#F5A800]">Visi &amp; Misi</span>
          <h2 className="mx-auto mt-3 max-w-2xl text-[28px] font-black leading-tight tracking-tight sm:text-[36px]">
            Komitmen kami menghadirkan dimsum beku premium
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-[#6B6B6B]">
            Bertumbuh secara berkelanjutan bersama mitra, dengan kualitas dan
            keamanan pangan sebagai prioritas utama.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Visi */}
          <div className="relative overflow-hidden rounded-3xl border border-[#EDE9DD] bg-white p-8 shadow-[0_12px_40px_rgba(17,17,17,0.05)] sm:p-10">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#FFC107]/10 blur-3xl" />
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFC107] text-[#111111] shadow-lg shadow-[#FFC107]/30">
                <Eye size={26} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Visi</h3>
            </div>
            <p className="text-base leading-relaxed text-[#3F3F3F] sm:text-lg">
              Menjadi penyedia <strong className="font-bold text-[#111111]">dimsum beku premium terkemuka di Indonesia</strong> yang
              dikenal karena kualitas produk yang unggul dan solusi produksi yang
              mempermudah mitra bisnis, serta berkontribusi pada perkembangan
              industri makanan beku secara berkelanjutan.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#8A6D00]">
              <Leaf size={16} strokeWidth={2.5} /> Pertumbuhan berkelanjutan
            </div>
          </div>

          {/* Misi */}
          <div className="relative overflow-hidden rounded-3xl border border-[#1A1A1A] bg-[#111111] p-8 text-white shadow-[0_12px_40px_rgba(17,17,17,0.18)] sm:p-10">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#FFC107]/20 blur-3xl" />
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFC107] text-[#111111] shadow-lg shadow-[#FFC107]/20">
                <Sparkles size={26} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Misi</h3>
            </div>
            <ul className="flex flex-col gap-4">
              {MISI_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFC107]/15 text-[#FFC107]">
                    <Icon size={15} strokeWidth={2.5} />
                  </span>
                  <span className="text-[15px] leading-relaxed text-white/85">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-auto bg-[#FFC107] py-8 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center sm:flex-row sm:text-left lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Image src="/logo-fast.webp" width={64} height={64} alt="MyProdusen mascot" className="h-14 w-14 object-contain drop-shadow-md sm:h-16 sm:w-16" />
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#111111] sm:text-[26px]">Siap memulai hari yang lebih produktif?</h2>
              <p className="mt-1 text-sm font-semibold text-[#3A2C00] sm:mt-2 sm:text-base">Masuk ke sistem dan kelola operasional tim Anda dengan lebih mudah.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#111111] px-8 py-4 font-black text-white shadow-lg shadow-black/20 transition-transform hover:bg-black/85 active:scale-95"
          >
            Masuk Sistem <ChevronRight size={18} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  );
}
