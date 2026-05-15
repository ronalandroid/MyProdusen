"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Clock, Users, Calendar, User, MapPin, Clock3, BarChart3, FileText, Shield } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Beranda", icon: Home, path: "/dashboard", primary: true },
    { name: "Kehadiran", icon: Clock, path: "/dashboard/attendance", primary: true },
    { name: "Karyawan", icon: Users, path: "/dashboard/employees", primary: true },
    { name: "Lokasi Kerja", icon: MapPin, path: "/dashboard/locations", primary: false },
    { name: "Shift", icon: Clock3, path: "/dashboard/shifts", primary: false },
    { name: "Cuti", icon: Calendar, path: "/dashboard/leave", primary: true },
    { name: "KPI", icon: BarChart3, path: "/dashboard/kpi", primary: false },
    { name: "Laporan", icon: FileText, path: "/dashboard/reports", primary: false },
    { name: "Audit", icon: Shield, path: "/dashboard/audit", primary: false },
    { name: "Akun", icon: User, path: "/dashboard/profile", primary: true },
  ];

  return (
    <>
      {/* Desktop Logo */}
      <div className="desktop-logo" style={{ padding: "0 16px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo.png" alt="MyProdusen" style={{ width: "40px", height: "40px", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
        <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
          My<span style={{ color: "var(--primary)" }}>Produsen</span>
        </span>
      </div>

      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
        const Icon = item.icon;
        
        return (
          <button
            type="button"
            key={item.path}
            className={`nav-item ${item.primary ? "" : "nav-item-desktop"} ${isActive ? "active" : ""}`}
            onClick={() => router.push(item.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className="nav-icon"
              strokeWidth={isActive ? 2.5 : 2}
              color={isActive ? "var(--warning)" : "var(--text-muted)"}
              aria-hidden="true"
            />
            <span className="nav-label" style={{ color: isActive ? "var(--warning)" : "var(--text-muted)" }}>
              {item.name}
            </span>
          </button>
        );
      })}
    </>
  );
}
