"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Clock, Users, Calendar, User } from "lucide-react";
import { fetchProfile, getToken } from "@/lib/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    fetchProfile()
      .then(() => setIsCheckingSession(false))
      .catch(() => router.replace("/login"));
  }, [router]);

  const navItems = [
    { name: "Beranda", icon: Home, path: "/dashboard" },
    { name: "Kehadiran", icon: Clock, path: "/dashboard/attendance" },
    { name: "Karyawan", icon: Users, path: "/dashboard/employees" },
    { name: "Cuti", icon: Calendar, path: "/dashboard/leave" },
    { name: "Akun", icon: User, path: "/dashboard/profile" },
  ];

  if (isCheckingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      {/* Navigation (Bottom on Mobile, Sidebar on Desktop) */}
      <div className="nav-container">
        {/* Logo for Desktop Sidebar */}
        <div className="desktop-logo" style={{ padding: "0 32px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="MyProdusen" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
          <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>My<span style={{ color: "var(--primary)" }}>Produsen</span></span>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <div
              key={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => router.push(item.path)}
            >
              <Icon
                className="nav-icon"
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? "var(--primary)" : "var(--text-muted)"}
              />
              <span className="nav-label" style={{ color: isActive ? "var(--primary)" : "var(--text-muted)" }}>
                {item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="mobile-content">
        {children}
      </div>
    </div>
  );
}
