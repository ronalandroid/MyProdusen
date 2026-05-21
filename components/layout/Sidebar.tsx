"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Users, Calendar, User, MapPin, Clock3, BarChart3, FileText, Shield, Bell, BriefcaseBusiness, CheckCircle } from "lucide-react";
import { getNavigationForRole } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/lib/permissions";

type SidebarProps = {
  role: UserRole;
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const iconMap: Record<string, any> = {
    '/dashboard': Home,
    '/dashboard/self-service': BriefcaseBusiness,
    '/dashboard/attendance': Clock,
    '/dashboard/attendance/exceptions': CheckCircle,
    '/dashboard/users': Users,
    '/dashboard/employees': Users,
    '/dashboard/locations': MapPin,
    '/dashboard/shifts': Clock3,
    '/dashboard/leave': Calendar,
    '/dashboard/kpi': BarChart3,
    '/dashboard/reports': FileText,
    '/dashboard/reports/attendance': FileText,
    '/dashboard/payroll': FileText,
    '/dashboard/overtime': Clock3,
    '/dashboard/documents': FileText,
    '/dashboard/notifications': Bell,
    '/dashboard/audit': Shield,
    '/dashboard/profile': User,
  };

  const allowedNav = getNavigationForRole(role);
  const navItems = allowedNav.map((item) => ({
    name: item.name,
    icon: iconMap[item.path] || Home,
    path: item.path,
    primary: item.primary,
  }));

  // Longest-prefix-wins so /dashboard/attendance/exceptions doesn't also light
  // the /dashboard/attendance tab. Compute once per pathname change.
  const activePath = useMemo(() => {
    let bestMatch = "";
    for (const item of navItems) {
      if (pathname === item.path) return item.path;
      if (item.path !== "/dashboard" && pathname.startsWith(`${item.path}/`)) {
        if (item.path.length > bestMatch.length) bestMatch = item.path;
      }
    }
    if (!bestMatch && pathname === "/dashboard") return "/dashboard";
    return bestMatch || pathname;
  }, [navItems, pathname]);

  return (
    <>
      {/* Desktop Logo */}
      <div className="desktop-logo" style={{ padding: "0 16px", marginBottom: "32px", alignItems: "center", gap: "10px" }}>
        <img src="/logo.png" alt="MyProdusen" style={{ width: "40px", height: "40px", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
        <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
          My<span style={{ color: "var(--primary)" }}>Produsen</span>
        </span>
      </div>

      {navItems.map((item) => {
        const isActive = activePath === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={item.path}
            prefetch
            className={`nav-item ${item.primary ? "" : "nav-item-desktop"} ${isActive ? "active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className="nav-icon"
              strokeWidth={isActive ? 2.5 : 2}
              color={isActive ? "var(--text-primary)" : "var(--text-muted)"}
              aria-hidden="true"
            />
            <span className="nav-label" style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );
}
