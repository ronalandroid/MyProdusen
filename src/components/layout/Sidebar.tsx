"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { fetchApiData } from "@/hooks/useDashboardQueries";
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
  const queryClient = useQueryClient();
  const isSuperadmin = role === "SUPERADMIN";

  const warmRouteData = (path: string) => {
    if (path === "/dashboard") {
      void queryClient.prefetchQuery({
        queryKey: ["dashboard", "stats"],
        queryFn: () => fetchApiData("/api/dashboard/stats", "Sebagian data dashboard gagal dimuat."),
        staleTime: 30_000,
      });
    } else if (path === "/dashboard/employees") {
      void queryClient.prefetchQuery({
        queryKey: ["employees", "all", ""],
        queryFn: () => fetchApiData("/api/employees?", "Gagal memuat data karyawan"),
        staleTime: 30_000,
      });
    } else if (path === "/dashboard/locations") {
      void queryClient.prefetchQuery({
        queryKey: ["work-locations", "all", ""],
        queryFn: () => fetchApiData("/api/work-locations?", "Gagal memuat lokasi kerja"),
        staleTime: 60_000,
      });
    } else if (path === "/dashboard/notifications") {
      void queryClient.prefetchQuery({
        queryKey: ["notifications", "all"],
        queryFn: () => fetchApiData("/api/notifications", "Notifikasi gagal dimuat"),
        staleTime: 30_000,
      });
    }
  };

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
            <span className="text-2xl font-black leading-tight text-[#1f2937] drop-shadow-sm">
              My<span className="text-[#6b3f00]">Produsen</span>
            </span>
            <span className="text-xs font-bold text-[#374151]">Produsen Dimsum Medan</span>
          </div>
          {isSuperadmin && (
            <span className="inline-flex items-center rounded-xl border border-[#8a5a00]/30 bg-[#fffdf2] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[#3f2a00] shadow-sm">
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
              onMouseEnter={() => warmRouteData(item.path)}
              onFocus={() => warmRouteData(item.path)}
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
