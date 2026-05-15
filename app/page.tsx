"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Clock, Users, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function SplashPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: Clock, text: "Absensi Real-time" },
    { icon: Users, text: "Manajemen Karyawan" },
    { icon: CheckCircle, text: "Cuti & Izin" },
    { icon: TrendingUp, text: "Laporan KPI" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-[var(--primary-dark)] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between p-6 sm:p-8 lg:p-12">
        {/* Header */}
        <div className={`w-full max-w-6xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="" className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">My</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Produsen</span>
              </div>
              <p className="text-xs sm:text-sm text-white/80 font-medium">Produsen Dimsum Medan</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col items-center justify-center text-center max-w-4xl transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="mb-8 sm:mb-12">
            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl animate-scale-in">
              <img src="/logo.png" alt="MyProdusen Logo" className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-contain" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">
            Kelola HR,<br className="sm:hidden" /> Lebih Mudah<br />
            Lebih Cepat, Lebih Baik
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-12 max-w-2xl font-medium">
            Satu sistem untuk semua kebutuhan manajemen karyawan. Absensi, cuti, penggajian, dan laporan dalam satu aplikasi.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 w-full max-w-3xl">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 100 + 600}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white text-center">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/login")}
            className="
              group
              bg-[var(--text-primary)] hover:bg-gray-900
              text-white
              px-8 sm:px-12 py-4 sm:py-5
              rounded-2xl
              font-bold text-base sm:text-lg
              shadow-2xl hover:shadow-3xl
              transition-all duration-300
              hover:scale-105
              active:scale-95
              flex items-center gap-3
              animate-fade-in
            "
            style={{ animationDelay: '1000ms' }}
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className={`w-full max-w-6xl text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm text-white/70">
            © 2026 MyProdusen. Sistem HRIS untuk Produsen Dimsum Medan.
          </p>
        </div>
      </div>
    </div>
  );
}
