"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, AlertTriangle, Calendar, Timer,
  BarChart3, Star, Wallet, FileText, Megaphone, Shield, Settings, UserCog,
  ChevronRight, Search,
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
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>MyProdusen</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            TBM Group · Konsol Admin
          </div>
        </div>
      </div>

      {/* Quick search trigger — opens the command palette (Cmd/Ctrl+K) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        aria-label="Pencarian cepat (Cmd+K)"
        style={{
          margin: "0 14px 4px", padding: "9px 12px",
          display: "flex", alignItems: "center", gap: 9,
          borderRadius: 10, border: "1px solid var(--border-color)",
          background: "var(--bg-hover)", cursor: "pointer", width: "calc(100% - 28px)",
        }}
      >
        <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Cari menu / karyawan</span>
        <kbd style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: 5, padding: "1px 5px" }}>⌘K</kbd>
      </button>

      <div style={{ flex: 1, padding: "0 10px 16px", overflowY: "auto" }}>
        {groups.map((group) => (
          <div key={group.label} style={{ marginTop: 14 }}>
            <div style={{
              padding: "0 12px 6px",
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)",
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
                      boxShadow: active ? "inset 3px 0 0 var(--primary)" : "inset 3px 0 0 transparent",
                      background: active ? "var(--primary-light)" : "transparent",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: active ? 800 : 600,
                      fontSize: 13, transition: "background 140ms ease",
                    }}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9,
                        background: "var(--danger)", color: "#FFFFFF",
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
