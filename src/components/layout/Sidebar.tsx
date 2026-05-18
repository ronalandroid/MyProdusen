"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Calendar,
  Clock,
  Clock3,
  FileText,
  Home,
  MapPin,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchProfile } from "@/lib/auth-client";
import { getNavigationForRole } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/lib/permissions";

const iconMap: Record<string, LucideIcon> = {
  "/dashboard": Home,
  "/dashboard/self-service": BriefcaseBusiness,
  "/dashboard/attendance": Clock,
  "/dashboard/attendance/exceptions": AlertTriangle,
  "/dashboard/employees": Users,
  "/dashboard/locations": MapPin,
  "/dashboard/shifts": Clock3,
  "/dashboard/leave": Calendar,
  "/dashboard/kpi": BarChart3,
  "/dashboard/reports": FileText,
  "/dashboard/documents": FileText,
  "/dashboard/notifications": Bell,
  "/dashboard/audit": Shield,
  "/dashboard/profile": User,
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((profile) => setRole(profile.role as UserRole))
      .catch(() => setRole("EMPLOYEE"));
  }, []);

  const navItems = (role ? getNavigationForRole(role) : [])
    .map((item) => ({
      name: item.name,
      icon: iconMap[item.path] || Home,
      path: item.path,
      primary: item.primary,
    }));

  return (
    <>
      <div className="desktop-logo">
        <div className="flex items-center gap-3 px-4 py-4">
          <img src="/logo.png" alt="MyProdusen Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-[var(--text-primary)] leading-tight">
              My<span className="text-[var(--primary)]">Produsen</span>
            </span>
            <span className="text-xs text-[var(--text-muted)]">HRIS System</span>
          </div>
        </div>
        <div className="h-px bg-[var(--border-color)] mx-4 my-2" />
      </div>

      <nav className="flex-1 px-2 lg:px-0" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.path}
              className={`nav-item ${item.primary ? "" : "nav-item-desktop"} ${isActive ? "active" : ""} group`}
              onClick={() => router.push(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={`nav-icon-wrapper ${isActive ? "text-[var(--primary)]" : "bg-transparent text-[var(--text-muted)]"} group-hover:text-[var(--primary-dark)] transition-all duration-200`}>
                <Icon className="nav-icon" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              </div>
              <span className={`nav-label ${isActive ? "text-[var(--primary)] font-semibold" : "text-[var(--text-muted)]"} group-hover:text-[var(--primary)]`}>
                {item.name}
              </span>
              {isActive && <div className="hidden lg:block absolute left-0 w-1 h-8 bg-[var(--primary)] rounded-r-full" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="hidden lg:block px-4 py-4 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
        Logout tersedia di menu Akun.
      </div>
    </>
  );
}
