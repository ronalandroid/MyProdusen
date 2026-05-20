"use client";

import { useEffect, useRef, useState } from "react";
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
  const contentRef = useRef<HTMLElement | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);

  useEffect(() => {
    if (profile) {
      if (!canAccessNavigationPath(profile.role as UserRole, pathname)) {
        setIsCheckingSession(false);
        router.replace("/dashboard");
      }
      return;
    }

    fetchProfile()
      .then((profile) => {
        setProfile(profile);
        if (!canAccessNavigationPath(profile.role as UserRole, pathname)) {
          setIsCheckingSession(false);
          router.replace("/dashboard");
          return;
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        setIsCheckingSession(false);
        router.replace("/login");
      });
  }, [pathname, profile, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, left: 0 });
    }
  }, [pathname]);

  if (isCheckingSession) {
    return (
      <div className="dashboard-auth-loading" role="status" aria-live="polite" aria-busy="true">
        <div className="dashboard-auth-card">
          <img src="/logo.png" alt="MyProdusen" className="h-16 w-16 object-contain" />
          <LoadingSpinner size="lg" message="Memeriksa sesi..." />
          <p className="text-xs text-[var(--text-muted)]">Menyiapkan dashboard aman Anda.</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <ToastProvider>
      <div className="layout-wrapper">
        {/* Navigation (Bottom on Mobile, Sidebar on Desktop) */}
        <a href="#dashboard-content" className="skip-link">Lewati navigasi</a>
        <nav className="nav-container" aria-label="Navigasi utama">
          <Sidebar role={profile.role as UserRole} />
        </nav>

        {/* Main Content Area */}
        <main id="dashboard-content" ref={contentRef} className="mobile-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
