import Image from "next/image";
import Link from "next/link";
import { Users, Clock, ShieldCheck, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#FFC107]/30 text-[#111111] overflow-x-hidden flex flex-col">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FFC107]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-[#FFC107]/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Image src="/logo-fast.webp" alt="MyProdusen Logo" width={56} height={56} className="w-12 h-12 lg:w-14 lg:h-14 object-contain" priority />
          <div className="flex flex-col">
            <span className="text-xl lg:text-2xl font-black tracking-tight leading-none text-[#111111]">
              My<span className="text-[#FFC107]">Produsen</span>
            </span>
            <span className="text-xs font-bold text-gray-500 mt-0.5">Produsen Dimsum Medan</span>
          </div>
        </div>
        <div>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center bg-[#111111] text-white px-6 py-3 rounded-full font-bold hover:bg-black/80 transition-transform active:scale-95 shadow-lg shadow-black/10"
          >
            Masuk Sistem
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center w-full">
        {/* Left Content */}
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFC107]/15 text-[#8A6D00] font-bold text-sm w-fit mb-6 lg:mb-8 border border-[#FFC107]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC107] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5A800]"></span>
            </span>
            Khusus TBM Mania 🚀
          </div>
          
          <h1 className="text-[34px] sm:text-[42px] lg:text-[52px] font-black text-[#111111] leading-[1.15] tracking-tight mb-6">
            Aplikasi HRIS kebanggaan <span className="text-[#F5A800]">TBM Mania</span> untuk mempermudah operasional, absensi, cuti, dan penggajian dalam <span className="relative whitespace-nowrap inline-block after:absolute after:bottom-1 after:left-0 after:w-full after:h-3 after:bg-[#FFC107]/40 after:-z-10">satu genggaman.</span>
          </h1>

          <div className="flex sm:hidden mt-2 mb-10">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center bg-[#FFC107] text-[#111111] px-6 py-4 rounded-[16px] font-black text-lg hover:bg-[#FFCA28] transition-transform active:scale-95 shadow-[0_8px_24px_rgba(255,193,7,0.3)]"
            >
              Mulai Sekarang
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 mt-4 lg:mt-12">
            {/* Feature 1 */}
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4C6] flex items-center justify-center text-[#F5A800]">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#111111]">Terintegrasi</h3>
                <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">
                  Semua kebutuhan HR TBM Mania terpusat dalam satu sistem.
                </p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4C6] flex items-center justify-center text-[#F5A800]">
                <Clock size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#111111]">Praktis & Cepat</h3>
                <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">
                  Akses absen, slip gaji, dan cuti kapan saja di mana saja.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4C6] flex items-center justify-center text-[#F5A800]">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#111111]">Aman</h3>
                <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">
                  Data karyawan terlindungi dengan keamanan terbaik.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Mobile Mockup */}
        <div className="relative flex justify-center lg:justify-end mt-4 lg:mt-0">
          <div className="relative w-[280px] sm:w-[320px] h-[580px] sm:h-[650px] bg-[#111111] rounded-[48px] shadow-[0_24px_80px_rgba(17,17,17,0.2)] border-[8px] border-[#111111] overflow-hidden flex flex-col transform lg:-rotate-2 transition-transform hover:rotate-0 duration-500 group">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-[#111111] w-32 mx-auto rounded-b-[16px] z-20"></div>
            
            {/* Screen Content - Mimicking the Splash/Onboarding */}
            <div className="flex-1 bg-[#FFC107] flex flex-col items-center justify-center p-6 relative">
              <div className="absolute top-8 left-6 flex items-center gap-2">
                 <Image src="/logo-fast.webp" width={28} height={28} alt="Logo" className="w-7 h-7" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black leading-tight text-[#111111]">My<span className="text-white">Produsen</span></span>
                   <span className="text-[6px] font-bold text-[#111111]">Produsen Dimsum Medan</span>
                 </div>
              </div>

              <Image src="/logo-fast.webp" width={160} height={160} alt="MyProdusen chicken mascot" className="mt-12 drop-shadow-xl w-32 sm:w-40 transform transition-transform duration-700 group-hover:scale-105" />
              
              <div className="mt-auto w-full pb-8">
                <h3 className="text-[22px] sm:text-2xl font-black text-[#111111] leading-tight text-center tracking-tight">
                  Kelola HR, Lebih Mudah<br />Lebih Cepat, Lebih Baik
                </h3>
                <p className="text-xs text-center font-bold text-[#111111]/70 mt-3 px-2">
                  Satu sistem untuk semua kebutuhan manajemen karyawan.
                </p>
                <div className="flex justify-center gap-1.5 mt-6 mb-8">
                  <div className="w-6 h-1.5 bg-[#111111] rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-[#111111]/20 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-[#111111]/20 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-[#111111]/20 rounded-full"></div>
                </div>
                <Link href="/login" className="block w-full bg-[#111111] text-white text-center py-3.5 rounded-[12px] font-bold text-sm hover:bg-black/80 transition-colors">
                  Mulai
                </Link>
              </div>
            </div>
          </div>
          
          {/* Decorative floating elements behind mockup */}
          <div className="absolute top-20 -right-10 w-24 h-24 bg-[#FFC107] rounded-full blur-[40px] -z-10 opacity-50"></div>
          <div className="absolute bottom-20 -left-10 w-32 h-32 bg-[#22C55E] rounded-full blur-[60px] -z-10 opacity-20"></div>
        </div>
      </main>

      {/* Bottom Banner */}
      <div className="bg-[#FFC107] py-8 sm:py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Image src="/logo-fast.webp" width={64} height={64} alt="MyProdusen chicken mascot" className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
            <div>
              <h2 className="text-xl sm:text-[26px] font-black text-[#111111] tracking-tight">Halo TBM Mania, Siap Gaspol? 🔥</h2>
              <p className="text-sm sm:text-base font-bold text-[#3A2C00] mt-1 sm:mt-2">Mari kerja lebih cerdas, cepat, dan makin solid bersama-sama.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#111111] text-white px-8 py-4 rounded-full font-black hover:bg-black/80 transition-transform active:scale-95 shadow-lg shadow-black/20 whitespace-nowrap"
          >
            Ayo Mulai Sekarang <ChevronRight size={18} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  );
}
