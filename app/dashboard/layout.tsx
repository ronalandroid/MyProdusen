"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { fetchProfile } from "@/lib/auth-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ToastProvider } from "@/components/ui/Toast";
import { canAccessNavigationPath } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/lib/permissions";
import type { ClientUserProfile } from "@/lib/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);

  useEffect(() => {
    if (profile) {
      if (!canAccessNavigationPath(profile.role as UserRole, pathname)) {
        router.replace("/dashboard");
      }
      return;
    }

    fetchProfile()
      .then((profile) => {
        setProfile(profile);
        if (!canAccessNavigationPath(profile.role as UserRole, pathname)) {
          router.replace("/dashboard");
          return;
        }
        setIsCheckingSession(false);
      })
      .catch(() => router.replace("/login"));
  }, [pathname, profile, router]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <LoadingSpinner size="lg" message="Memeriksa sesi..." />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="layout-wrapper">
        {/* Navigation (Bottom on Mobile, Sidebar on Desktop) */}
        <nav className="nav-container" aria-label="Main navigation">
          <Sidebar />
        </nav>

        {/* Main Content Area */}
        <main className="mobile-content">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
