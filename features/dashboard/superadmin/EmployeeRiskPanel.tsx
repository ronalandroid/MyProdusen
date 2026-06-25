import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { EmptyMiniState } from "./EmptyMiniState";

export function EmployeeRiskPanel({ risks }: { risks: SuperadminInsights['employeeRisks'] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Risk Alert</p>
          <h3 className="text-base sm:text-lg">Karyawan Perlu Perhatian</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Telat, absen, dan KPI rendah.</p>
        </div>
        <ShieldCheck size={22} className="text-[var(--danger)]" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        {risks.length ? risks.map((risk) => (
          <Link key={risk.employeeId} href={`/dashboard/employees/${risk.employeeId}`} className="block rounded-xl border border-[var(--border-color)] p-3 hover:border-[var(--primary)] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{risk.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{risk.division}</p>
              </div>
              <span className="badge badge-danger">Risk {risk.riskScore}</span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{risk.lateCount} telat · {risk.absentCount} absen · KPI {risk.averageKpi || '-'}</p>
          </Link>
        )) : <EmptyMiniState title="Risiko rendah" description="Belum ada karyawan dengan sinyal risiko tinggi." />}
      </div>
    </div>
  );
}
