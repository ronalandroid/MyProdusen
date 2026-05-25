"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  Clock,
  Clock3,
  FileText,
  Home,
  MapPin,
  Shield,
  User,
  Users,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getNavigationForRole } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/lib/permissions";

type SidebarProps = {
  role: UserRole;
};

const iconMap: Record<string, LucideIcon> = {
  "/dashboard": Home,
  "/dashboard/self-service": BriefcaseBusiness,
  "/dashboard/attendance": Clock,
  "/dashboard/attendance/exceptions": CheckCircle,
  "/dashboard/employees": Users,
  "/dashboard/locations": MapPin,
  "/dashboard/shifts": Clock3,
  "/dashboard/leave": Calendar,
  "/dashboard/kpi": BarChart3,
  "/dashboard/reports": FileText,
  "/dashboard/reports/attendance": FileText,
  "/dashboard/documents": FileText,
  "/dashboard/notifications": Bell,
  "/dashboard/audit": Shield,
  "/dashboard/settings": Settings,
  "/dashboard/profile": User,
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isSuperadmin = role === "SUPERADMIN";

  const navItems = getNavigationForRole(role)
    .map((item) => ({
      name: item.name,
      icon: iconMap[item.path] || Home,
      path: item.path,
      primary: item.primary,
    }));

  return (
    <>
      <div className="desktop-logo">
        <div className="flex flex-col items-center gap-3 px-5 py-6 text-center">
          <img src="/logo.png" alt="MyProdusen Logo" className="w-24 h-24 object-contain drop-shadow-sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
              My<span className="text-[var(--primary)]">Produsen</span>
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Produsen Dimsum Medan</span>
          </div>
          {isSuperadmin && (
            <span className="inline-flex items-center rounded-xl bg-[var(--text-primary)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--primary)] shadow-sm">
              Super Admin
            </span>
          )}
        </div>
        <div className="h-px bg-[var(--border-color)] mx-4 my-2" />
      </div>

      <nav className="flex-1 px-2 lg:px-0" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch
              className={`nav-item ${item.primary ? "" : "nav-item-desktop"} ${isActive ? "active" : ""} group`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={`nav-icon-wrapper ${isActive ? "text-[var(--primary)]" : "bg-transparent text-[var(--text-muted)]"} group-hover:text-[var(--primary-dark)] transition-all duration-200`}>
                <Icon className="nav-icon" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              </div>
              <span className={`nav-label ${isActive ? "text-[var(--primary)] font-semibold" : "text-[var(--text-muted)]"} group-hover:text-[var(--primary)]`}>
                {item.name}
              </span>
              {isActive && <div className="hidden lg:block absolute left-0 w-1 h-8 bg-[var(--primary)] rounded-r-full" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

    </>
  );
}
