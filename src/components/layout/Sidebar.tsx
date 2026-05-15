"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Clock, Users, Calendar, User, MapPin, Clock3, BarChart3, FileText, Shield, LogOut } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { name: "Beranda", icon: Home, path: "/dashboard", primary: true },
    { name: "Kehadiran", icon: Clock, path: "/dashboard/attendance", primary: true },
    { name: "Karyawan", icon: Users, path: "/dashboard/employees", primary: true },
    { name: "Cuti", icon: Calendar, path: "/dashboard/leave", primary: true },
    { name: "Akun", icon: User, path: "/dashboard/profile", primary: true },
    { name: "Lokasi", icon: MapPin, path: "/dashboard/locations", primary: false },
    { name: "Shift", icon: Clock3, path: "/dashboard/shifts", primary: false },
    { name: "KPI", icon: BarChart3, path: "/dashboard/kpi", primary: false },
    { name: "Laporan", icon: FileText, path: "/dashboard/reports", primary: false },
    { name: "Audit", icon: Shield, path: "/dashboard/audit", primary: false },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Desktop Logo & Brand */}
      <div className="desktop-logo">
        <div className="flex items-center gap-3 px-4 py-4">
          <img src="/logo.png" alt="MyProdusen Logo" className="w-10 h-10 object-contain" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--text-primary)]">
              My<span className="text-[var(--primary)]">Produsen</span>
            </span>
            <span className="text-xs text-[var(--text-muted)]">HRIS System</span>
          </div>
        </div>
        <div className="h-px bg-[var(--border-color)] mx-4 my-2" />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 lg:px-0" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <button
              type="button"
              key={item.path}
              className={`
                nav-item
                ${item.primary ? "" : "nav-item-desktop"}
                ${isActive ? "active" : ""}
                group
              `}
              onClick={() => router.push(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={`
                nav-icon-wrapper
                ${isActive ? 'bg-[var(--primary)] text-[var(--text-primary)]' : 'bg-transparent text-[var(--text-muted)]'}
                group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary-dark)]
                transition-all duration-200
              `}>
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
              </div>
              <span className={`
                nav-label
                ${isActive ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)]'}
                group-hover:text-[var(--text-primary)]
              `}>
                {item.name}
              </span>
              {isActive && (
                <div className="hidden lg:block absolute left-0 w-1 h-8 bg-[var(--primary)] rounded-r-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Desktop Logout Button */}
      <div className="hidden lg:block px-4 py-4 border-t border-[var(--border-color)]">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="
            w-full flex items-center gap-3 px-4 py-3
            text-[var(--danger)] hover:bg-red-50
            rounded-xl transition-all duration-200
            font-medium text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]
          "
        >
          <LogOut size={20} aria-hidden="true" />
          <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
        </button>
      </div>
    </>
  );
}
