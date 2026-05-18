"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Clock, Users, Calendar, User, MapPin, Clock3, BarChart3, FileText, Shield, Bell, AlertTriangle, BriefcaseBusiness } from "lucide-react";
import { fetchProfile } from "@/lib/auth-client";
import { getNavigationForRole } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/lib/permissions";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((profile) => setRole(profile.role as UserRole))
      .catch(() => setRole('EMPLOYEE'));
  }, []);

  const iconMap: Record<string, any> = {
    '/dashboard': Home,
    '/dashboard/self-service': BriefcaseBusiness,
    '/dashboard/attendance': Clock,
    '/dashboard/attendance/exceptions': AlertTriangle,
    '/dashboard/users': Users,
    '/dashboard/employees': Users,
    '/dashboard/locations': MapPin,
    '/dashboard/shifts': Clock3,
    '/dashboard/leave': Calendar,
    '/dashboard/kpi': BarChart3,
    '/dashboard/reports': FileText,
    '/dashboard/payroll': FileText,
    '/dashboard/overtime': Clock3,
    '/dashboard/documents': FileText,
    '/dashboard/notifications': Bell,
    '/dashboard/audit': Shield,
    '/dashboard/profile': User,
  };

  const allowedNav = role ? getNavigationForRole(role) : [];
  const navItems = allowedNav.map((item) => ({
    name: item.name,
    icon: iconMap[item.path] || Home,
    path: item.path,
    primary: item.primary,
  }));

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
