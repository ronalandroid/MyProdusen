"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCog, Clock, AlertTriangle, Calendar, CalendarClock,
  CalendarRange, MapPin, Timer, BarChart3, ClipboardList, Star, Wallet, FileText,
  Megaphone, Folder, Bell, Shield, Settings, KeyRound, UserCircle, Circle,
  ChevronDown, Search,
} from "lucide-react";
import {
  getGroupedNavigationForRole,
  type NavigationItemKey,
  type NavigationGroupKey,
} from "@/lib/navigation/role-navigation";

interface AdminSidebarProps {
  pendingExceptions?: number;
  pendingLeave?: number;
  pendingOT?: number;
  pendingKpi?: number;
  isSuperadmin?: boolean;
}

const ICONS: Partial<Record<NavigationItemKey, React.ElementType>> = {
  dashboard: LayoutDashboard,
  attendance: Clock,
  leave: Calendar,
  overtime: Timer,
  "attendance-exceptions": AlertTriangle,
  "attendance-schedules": CalendarClock,
  shifts: CalendarRange,
  locations: MapPin,
  employees: Users,
  users: UserCog,
  kpi: BarChart3,
  "kpi-template": ClipboardList,
  "performance-assessment": Star,
  reports: FileText,
  payroll: Wallet,
  announcements: Megaphone,
  documents: Folder,
  notifications: Bell,
  audit: Shield,
  settings: Settings,
  accounts: KeyRound,
  profile: UserCircle,
};

export default function AdminSidebar({
  pendingExceptions = 0,
  pendingLeave = 0,
  pendingOT = 0,
  pendingKpi = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Badges only where an action is genuinely pending.
  const badges: Partial<Record<NavigationItemKey, number>> = {
    "attendance-exceptions": pendingExceptions,
    leave: pendingLeave,
    overtime: pendingOT,
    kpi: pendingKpi,
  };

  const groups = getGroupedNavigationForRole("SUPERADMIN");

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname === path || pathname.startsWith(`${path}/`);

  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i.path)))?.key;
  const groupBadgeTotal = (key: NavigationGroupKey) =>
    groups.find((g) => g.key === key)?.items.reduce((sum, i) => sum + (badges[i.key] ?? 0), 0) ?? 0;

  // A group is open if the user toggled it open, else default: Utama + the active group.
  const [overrides, setOverrides] = useState<Partial<Record<NavigationGroupKey, boolean>>>({});
  const isOpen = (key: NavigationGroupKey) => overrides[key] ?? (key === "utama" || key === activeGroup);
  const toggle = (key: NavigationGroupKey) => setOverrides((o) => ({ ...o, [key]: !isOpen(key) }));

  return (
    <>
      <div style={{ margin: "16px 14px 8px", padding: "0 6px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "linear-gradient(180deg, #FFC107, #FFD85A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Image src="/logo-fast.webp" alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>MyProdusen</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            TBM Group · Konsol Admin
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        aria-label="Pencarian cepat (Cmd+K)"
        style={{ margin: "0 14px 4px", padding: "9px 12px", display: "flex", alignItems: "center", gap: 9, borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-hover)", cursor: "pointer", width: "calc(100% - 28px)" }}
      >
        <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Cari menu / karyawan</span>
        <kbd style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: 5, padding: "1px 5px" }}>⌘K</kbd>
      </button>

      <div style={{ flex: 1, padding: "0 10px 16px", overflowY: "auto" }}>
        {groups.map((group) => {
          const open = isOpen(group.key);
          const collapsedBadge = !open ? groupBadgeTotal(group.key) : 0;
          return (
            <div key={group.key} style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={open}
                aria-controls={`navgroup-${group.key}`}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "transparent", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}
              >
                <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
                {collapsedBadge > 0 ? (
                  <span aria-label={`${collapsedBadge} perlu tindakan`} style={{ minWidth: 16, height: 16, borderRadius: 8, background: "var(--danger)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", fontFamily: "var(--font-mono, monospace)" }}>
                    {collapsedBadge}
                  </span>
                ) : null}
                <ChevronDown size={13} style={{ transition: "transform 160ms ease", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }} aria-hidden="true" />
              </button>

              {open && (
                <div id={`navgroup-${group.key}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    const Icon = ICONS[item.key] ?? Circle;
                    const badge = badges[item.key] ?? 0;
                    return (
                      <Link
                        key={item.key}
                        href={item.path}
                        aria-current={active ? "page" : undefined}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, textDecoration: "none", boxShadow: active ? "inset 3px 0 0 var(--primary)" : "inset 3px 0 0 transparent", background: active ? "var(--primary-light)" : "transparent", color: active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 800 : 600, fontSize: 13, transition: "background 140ms ease" }}
                      >
                        <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} aria-hidden="true" />
                        <span style={{ flex: 1 }}>{item.name}</span>
                        {badge > 0 ? (
                          <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "var(--danger)", color: "#FFFFFF", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", fontFamily: "var(--font-mono, monospace)" }}>
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
