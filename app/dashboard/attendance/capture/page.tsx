"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AttendanceCaptureRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type") === "clock-out" ? "clock-out" : "clock-in";
    router.replace(`/dashboard/attendance/clock?type=${type}`);
  }, [router, searchParams]);

  return (
    <div className="phone-screen attendance-screen" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="card p-4 text-sm font-semibold text-[var(--text-secondary)]">Membuka Validasi Lokasi…</div>
    </div>
  );
}
