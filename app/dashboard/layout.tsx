"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { fetchProfile } from "@/lib/auth-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then(() => setIsCheckingSession(false))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <LoadingSpinner size="lg" message="Memeriksa sesi..." />
      </div>
    );
  }

  return (
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
  );
}
