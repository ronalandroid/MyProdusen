"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { fetchApiData } from "@/hooks/useDashboardQueries";

type Holiday = { id: string; date: string; name: string; type: string; isPaidHoliday: boolean };

const dateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFormatter.format(new Date(y, m - 1, d));
}

export default function UpcomingHolidaysCard() {
  const { data, isLoading } = useQuery<Holiday[]>({
    queryKey: ["work-calendar", "upcoming"],
    queryFn: () => fetchApiData<Holiday[]>("/api/work-calendar/upcoming", "Gagal memuat hari libur"),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  if (isLoading) return null;
  const holidays = data ?? [];

  return (
    <section className="card" style={{ padding: "24px" }} aria-labelledby="upcoming-holidays-title">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <CalendarDays size={20} style={{ color: "var(--primary-dark)" }} aria-hidden="true" />
        <h2 id="upcoming-holidays-title" className="text-lg font-bold">Hari Libur Mendatang</h2>
      </div>
      {holidays.length === 0 ? (
        <p className="text-sm" role="status" style={{ color: "var(--text-secondary)" }}>
          Belum ada hari libur terjadwal. Superadmin akan menambahkan kalender libur nasional & cuti bersama di sini.
        </p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", margin: 0, padding: 0 }}>
          {holidays.map((holiday) => (
            <li
              key={holiday.id}
              className="rounded-2xl border border-[var(--border-color)]"
              style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
            >
              <div>
                <p className="font-bold text-sm">{holiday.name}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatDate(holiday.date)}</p>
              </div>
              <span className={`badge ${holiday.isPaidHoliday ? "badge-success" : "badge-info"}`}>
                {holiday.isPaidHoliday ? "Libur dibayar" : "Libur"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
