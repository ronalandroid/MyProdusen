"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { EmptyMiniState } from "./EmptyMiniState";

export function PendingApprovalsPanel({ approvals }: { approvals: SuperadminInsights['pendingApprovalsList'] }) {
  const [pendingId, setPendingId] = useState<string>("");
  const [feedback, setFeedback] = useState<{ id: string; tone: "success" | "danger"; message: string } | null>(null);
  const [items, setItems] = useState(approvals || []);

  useEffect(() => {
    setItems(approvals || []);
  }, [approvals]);

  if (!approvals) return null;

  async function decide(approval: NonNullable<SuperadminInsights['pendingApprovalsList']>[number], status: 'APPROVED' | 'REJECTED') {
    if (pendingId) return;
    setPendingId(approval.id);
    setFeedback(null);
    try {
      const note = status === 'APPROVED'
        ? 'Disetujui dari dashboard.'
        : 'Ditolak dari dashboard. Silakan tinjau detail di Approval Center.';
      const endpoint = approval.type === 'Cuti/Izin'
        ? `/api/leave/${approval.id}/${status === 'APPROVED' ? 'approve' : 'reject'}`
        : `/api/attendance/exceptions/${approval.id}/review`;
      const response = await fetch(endpoint, {
        method: approval.type === 'Cuti/Izin' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(approval.type === 'Cuti/Izin' ? (status === 'APPROVED' ? {} : { reason: note }) : { status, reviewNote: note }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Gagal memproses approval.');
      }
      setItems((current) => current.filter((row) => row.id !== approval.id));
      setFeedback({ id: approval.id, tone: 'success', message: status === 'APPROVED' ? 'Disetujui.' : 'Ditolak.' });
    } catch (error) {
      setFeedback({ id: approval.id, tone: 'danger', message: error instanceof Error ? error.message : 'Gagal memproses approval.' });
    } finally {
      setPendingId("");
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Butuh Tindakan</p>
          <h3 className="text-base sm:text-lg">Approval Pending</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Setujui atau tolak langsung dari sini.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--warning-bg)] flex items-center justify-center">
          <CheckCircle size={22} className="text-[var(--warning)]" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-3">
        {items && items.length > 0 ? items.map((approval) => {
          const detailHref = approval.type === 'Cuti/Izin' ? '/dashboard/leave' : '/dashboard/attendance/exceptions';
          const isPending = pendingId === approval.id;
          return (
            <div key={approval.id} className="rounded-xl border border-[var(--border-color)] p-3 hover:border-[var(--primary)] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge badge-warning mb-2">{approval.type}</span>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{approval.employeeName}</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{approval.detail}</p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                {new Date(approval.time).toLocaleDateString('id-ID', { dateStyle: 'short' })}
              </p>
              {feedback?.id === approval.id && (
                <p
                  role="status"
                  className="mt-2 text-[11px] font-semibold"
                  style={{ color: feedback.tone === 'success' ? 'var(--success)' : 'var(--danger)' }}
                >
                  {feedback.message}
                </p>
              )}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link
                  href={detailHref}
                  className="btn btn-secondary btn-sm"
                  aria-label={`Lihat detail ${approval.type} ${approval.employeeName}`}
                >
                  <Eye size={14} aria-hidden="true" /> Detail
                </Link>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  disabled={isPending}
                  onClick={() => decide(approval, 'APPROVED')}
                >
                  <ThumbsUp size={14} aria-hidden="true" /> {isPending ? '...' : 'Setujui'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  disabled={isPending}
                  onClick={() => decide(approval, 'REJECTED')}
                >
                  <ThumbsDown size={14} aria-hidden="true" /> {isPending ? '...' : 'Tolak'}
                </button>
              </div>
            </div>
          );
        }) : <EmptyMiniState title="Semua beres!" description="Tidak ada antrian persetujuan." />}
      </div>
      {items && items.length > 0 && (
        <div className="mt-4 text-center">
          <Link href="/dashboard/attendance/exceptions" className="text-link text-xs font-semibold">Lihat Semua Approval</Link>
        </div>
      )}
    </div>
  );
}
