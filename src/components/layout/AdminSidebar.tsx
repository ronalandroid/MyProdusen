"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, AlertTriangle, Calendar, Timer,
  BarChart3, Star, Wallet, FileText, Megaphone, Shield, Settings, UserCog,
  ChevronRight,
} from "lucide-react";

interface AdminSidebarProps {
  pendingExceptions?: number;
  pendingLeave?: number;
  pendingOT?: number;
  pendingKpi?: number;
  isSuperadmin?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function AdminSidebar({
  pendingExceptions = 0,
  pendingLeave = 0,
  pendingOT = 0,
  pendingKpi = 0,
  isSuperadmin = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      label: "UTAMA",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Karyawan", path: "/dashboard/employees", icon: Users },
      ],
    },
    {
      label: "OPERASIONAL",
      items: [
        { label: "Absensi", path: "/dashboard/attendance", icon: Clock },
        { label: "Pengecualian", path: "/dashboard/attendance/exceptions", icon: AlertTriangle, badge: pendingExceptions },
        { label: "Cuti & Izin", path: "/dashboard/leave", icon: Calendar, badge: pendingLeave },
        { label: "Lembur", path: "/dashboard/overtime", icon: Timer, badge: pendingOT },
        { label: "KPI", path: "/dashboard/kpi", icon: BarChart3, badge: pendingKpi },
        { label: "Template KPI", path: "/dashboard/kpi-template", icon: BarChart3 },
        { label: "Penilaian", path: "/dashboard/performance/assessment", icon: Star },
      ],
    },
    {
      label: "FINANSIAL",
      items: [
        { label: "Penggajian", path: "/dashboard/payroll", icon: Wallet },
      ],
    },
    {
      label: "LAINNYA",
      items: [
        { label: "Laporan", path: "/dashboard/reports", icon: FileText },
        { label: "Pengumuman", path: "/dashboard/announcements", icon: Megaphone },
        { label: "Audit Log", path: "/dashboard/audit", icon: Shield },
        { label: "Pengaturan", path: "/dashboard/settings", icon: Settings },
      ],
    },
  ];

  if (isSuperadmin) {
    groups.push({
      label: "SUPERADMIN",
      items: [
        { label: "Akun & Peran", path: "/dashboard/accounts", icon: UserCog },
      ],
    });
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Logo */}
      <div style={{ margin: "16px 14px 8px", padding: "0 6px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(180deg, #FFC107, #FFD85A)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src="/logo.png" alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111111", letterSpacing: "-0.01em" }}>MyProdusen</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#6E6E6E", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            TBM Group · Konsol Admin
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 10px 16px", overflowY: "auto" }}>
        {groups.map((group) => (
          <div key={group.label} style={{ marginTop: 14 }}>
            <div style={{
              padding: "0 12px 6px",
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#6E6E6E",
            }}>
              {group.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {group.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                      border: "none",
                      boxShadow: active ? "inset 3px 0 0 #FFC107" : "inset 3px 0 0 transparent",
                      background: active ? "#FFF8DC" : "transparent",
                      color: active ? "#111111" : "#555555",
                      fontWeight: active ? 800 : 600,
                      fontSize: 13, transition: "background 140ms ease",
                    }}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9,
                        background: "#B3362B", color: "#FFFFFF",
                        fontSize: 10, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 5px",
                        fontFamily: "var(--font-mono, monospace)",
                      }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
