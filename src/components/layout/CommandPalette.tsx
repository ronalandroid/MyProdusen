"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Users, ArrowRight } from "lucide-react";
import { getNavigationForRole } from "@/lib/navigation/role-navigation";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import type { UserRole } from "@/lib/permissions";

type EmployeeHit = { id: string; fullName: string; nip?: string | null };

type PaletteItem =
  | { kind: "nav"; id: string; label: string; href: string }
  | { kind: "employee"; id: string; label: string; sublabel?: string; href: string };

export default function CommandPalette({ role }: { role: UserRole | string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const navItems = useMemo(() => getNavigationForRole(role), [role]);
  const canSearchEmployees = role === "SUPERADMIN";

  // Clear stale employee hits the moment the query drops below the search
  // threshold. Adjusted during render (conditional + converging) instead of an
  // effect, so users never see a frame of old results against the new query.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (query.trim().length < 2 && employees.length > 0) {
    setEmployees([]);
  }

  // Toggle on Cmd/Ctrl+K from anywhere, plus a custom event for the visible
  // sidebar trigger so mouse users can open it too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  // Reset + focus when opened.
  useEffect(() => {
    if (open) {
      setQuery("");
      setEmployees([]);
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced employee search (superadmin only).
  useEffect(() => {
    if (!open || !canSearchEmployees) return;
    const q = query.trim();
    if (q.length < 2) {
      // Clearing stale hits is handled during render above.
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const rows = await fetchApiData<EmployeeHit[]>(
          `/api/employees?search=${encodeURIComponent(q)}&limit=6`,
          "",
        );
        if (!cancelled) setEmployees(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setEmployees([]);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, canSearchEmployees]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const navHits: PaletteItem[] = navItems
      .filter((n) => !q || n.name.toLowerCase().includes(q))
      .map((n) => ({ kind: "nav", id: `nav:${n.path}`, label: n.name, href: n.path }));
    const empHits: PaletteItem[] = employees.map((e) => ({
      kind: "employee",
      id: `emp:${e.id}`,
      label: e.fullName,
      sublabel: e.nip || undefined,
      href: `/dashboard/employees/${e.id}`,
    }));
    return [...navHits, ...empHits];
  }, [navItems, employees, query]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  const go = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      go(items[activeIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian cepat"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1080,
        background: "var(--bg-overlay)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "12vh 16px 16px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 18,
          boxShadow: "var(--shadow-xl, 0 24px 64px rgba(0,0,0,0.25))",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={canSearchEmployees ? "Cari menu atau karyawan..." : "Cari menu..."}
            aria-label="Cari menu atau karyawan"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 15,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          <kbd style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: 6, padding: "2px 6px" }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: "52vh", overflowY: "auto", padding: 8 }}>
          {items.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              {query.trim().length >= 2 ? "Tidak ada hasil." : "Ketik untuk mencari menu atau karyawan."}
            </div>
          ) : (
            items.map((item, idx) => {
              const active = idx === activeIndex;
              const isEmp = item.kind === "employee";
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => go(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: active ? "var(--primary-light)" : "transparent",
                    color: "var(--text-primary)",
                    transition: "background 120ms",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: isEmp ? "var(--info-bg)" : "var(--bg-hover)",
                      color: isEmp ? "var(--info)" : "var(--text-secondary)",
                    }}
                  >
                    {isEmp ? <Users size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                    {isEmp && item.sublabel && (
                      <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>{item.sublabel}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {isEmp ? "Karyawan" : "Menu"}
                  </span>
                  {active && <CornerDownLeft size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
