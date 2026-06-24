import { Users, MapPin, Calendar, FileText, Banknote, BarChart3, Settings, ClipboardList } from "lucide-react";

export const numberFormatter = new Intl.NumberFormat("id-ID");

export const SUPERADMIN_QUICK_ACTIONS = [
  { name: "Karyawan", path: "/dashboard/employees", icon: Users, bg: "rgba(59,130,246,0.1)", text: "var(--info)" },
  { name: "Lokasi/Shift", path: "/dashboard/locations", icon: MapPin, bg: "rgba(251,191,36,0.15)", text: "#D97706" },
  { name: "Kebijakan Absensi", path: "/dashboard/settings", icon: Settings, bg: "rgba(34,197,94,0.1)", text: "var(--success)" },
  { name: "Kalender Kerja", path: "/dashboard/settings", icon: Calendar, bg: "rgba(245,158,11,0.1)", text: "var(--warning)" },
  { name: "KPI", path: "/dashboard/kpi/template", icon: BarChart3, bg: "rgba(124,58,237,0.1)", text: "#7C3AED" },
  { name: "Payroll", path: "/dashboard/payroll", icon: Banknote, bg: "rgba(229,57,53,0.1)", text: "var(--danger)" },
  { name: "Cuti", path: "/dashboard/leave", icon: ClipboardList, bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
  { name: "Laporan PDF", path: "/dashboard/reports/pdf", icon: FileText, bg: "var(--primary-light)", text: "var(--primary-dark)" },
];
