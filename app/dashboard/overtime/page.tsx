'use client';

import { useCallback, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle, XCircle, Zap, Plus, X } from 'lucide-react';
import { fetchApiData, fetchApiList } from '@/hooks/useDashboardQueries';
import { SkeletonList, SkeletonStatsGrid } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface OvertimeRate {
  id: string;
  name: string;
  multiplier: number;
  isWeekday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
}

interface OvertimeRequest {
  request: {
    id: string;
    overtimeDate: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    calculatedPay: number;
    approvedAt: string | null;
    rejectedReason: string | null;
  };
  employee: {
    id: string;
    nip: string;
    fullName: string;
    position: string;
  };
  rate: {
    name: string;
    multiplier: number;
  };
}

interface FormData {
  overtimeDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  rateId: string;
  reason: string;
}

const EMPTY_FORM: FormData = {
  overtimeDate: '',
  startTime: '',
  endTime: '',
  durationHours: 0,
  rateId: '',
  reason: '',
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge',
};

function calculateDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

interface State {
  showModal: boolean;
  rejectId: string | null;
  filter: string;
  pendingApproveId: string | null;
  feedback: string | null;
  feedbackType: 'success' | 'error';
  formData: FormData;
}

type Action =
  | { type: 'SET_MODAL'; showModal: boolean }
  | { type: 'SET_REJECT_ID'; rejectId: string | null }
  | { type: 'SET_FILTER'; filter: string }
  | { type: 'SET_PENDING_APPROVE'; pendingApproveId: string | null }
  | { type: 'SET_FEEDBACK'; feedback: string | null; feedbackType?: 'success' | 'error' }
  | { type: 'SET_FORM'; formData: FormData }
  | { type: 'RESET_FORM' };

const INITIAL_STATE: State = {
  showModal: false,
  rejectId: null,
  filter: 'ALL',
  pendingApproveId: null,
  feedback: null,
  feedbackType: 'success',
  formData: EMPTY_FORM,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODAL': return { ...state, showModal: action.showModal };
    case 'SET_REJECT_ID': return { ...state, rejectId: action.rejectId };
    case 'SET_FILTER': return { ...state, filter: action.filter };
    case 'SET_PENDING_APPROVE': return { ...state, pendingApproveId: action.pendingApproveId };
    case 'SET_FEEDBACK': return { ...state, feedback: action.feedback, feedbackType: action.feedbackType ?? 'success' };
    case 'SET_FORM': return { ...state, formData: action.formData };
    case 'RESET_FORM': return { ...state, formData: EMPTY_FORM };
    default: return state;
  }
}

function StatsCards({ requests }: { requests: OvertimeRequest[] }) {
  const pending = requests.filter((r) => r.request.status === 'PENDING').length;
  const approved = requests.filter((r) => r.request.status === 'APPROVED').length;
  const totalHours = requests
    .filter((r) => r.request.status === 'APPROVED')
    .reduce((sum, r) => sum + r.request.durationHours, 0)
    .toFixed(1);

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {[
        { label: 'Total', value: requests.length, icon: Clock, color: 'var(--info)' },
        { label: 'Menunggu', value: pending, icon: Clock, color: 'var(--warning)' },
        { label: 'Disetujui', value: approved, icon: CheckCircle, color: 'var(--success)' },
        { label: 'Total Jam', value: `${totalHours}j`, icon: Zap, color: 'var(--primary-dark)' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <Icon size={15} style={{ color }} aria-hidden="true" /> {label}
          </div>
          <div className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{value}</div>
        </div>
      ))}
    </section>
  );
}

function FilterTabs({ filter, onSelect }: { filter: string; onSelect: (s: string) => void }) {
  const tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className={`btn btn-sm shrink-0 ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
        >
          {t === 'ALL' ? 'Semua' : STATUS_LABEL[t]}
        </button>
      ))}
    </div>
  );
}

function RequestCard({
  item,
  pendingApproveId,
  onApprove,
  onReject,
}: {
  item: OvertimeRequest;
  pendingApproveId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { request, employee, rate } = item;
  const isPending = request.status === 'PENDING';
  const isConfirming = pendingApproveId === request.id;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{employee.fullName}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{employee.nip} · {employee.position}</p>
        </div>
        <span className={`badge shrink-0 ${STATUS_CLASS[request.status]}`}>{STATUS_LABEL[request.status]}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Tanggal</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{dateFormatter.format(new Date(request.overtimeDate))}</span>
        </div>
        <div>
          <span className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Waktu</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{request.startTime}–{request.endTime}</span>
        </div>
        <div>
          <span className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Durasi</span>
          <span className="font-semibold" style={{ color: 'var(--info)' }}>{request.durationHours} jam</span>
        </div>
        <div>
          <span className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Rate</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{rate.name} ({rate.multiplier}×)</span>
        </div>
      </div>

      {request.calculatedPay > 0 && (
        <div className="mb-3 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
          {currencyFormatter.format(request.calculatedPay)}
        </div>
      )}

      {request.reason && (
        <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          Alasan: {request.reason}
        </p>
      )}

      {request.rejectedReason && (
        <p className="mb-3 text-xs rounded-xl px-3 py-2" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
          Ditolak: {request.rejectedReason}
        </p>
      )}

      {isPending && (
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={() => onApprove(request.id)}
            className={`btn btn-sm flex-1 ${isConfirming ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isConfirming ? '✓ Konfirmasi' : 'Setujui'}
          </button>
          <button
            type="button"
            onClick={() => onReject(request.id)}
            className="btn btn-sm btn-danger flex-1"
          >
            Tolak
          </button>
        </div>
      )}
    </div>
  );
}

function RejectModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Alasan penolakan minimal 10 karakter.');
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="reject-modal-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Tolak Lembur
          </h2>
          <button type="button" onClick={onClose} className="btn btn-icon btn-secondary" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Berikan alasan penolakan yang jelas agar karyawan dapat mengajukan ulang.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reject-reason" className="label">Alasan Penolakan</label>
            <textarea
              id="reject-reason"
              className="input resize-none"
              rows={4}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="Minimal 10 karakter..."
              autoFocus
            />
            <div className="mt-1 flex justify-between">
              {error ? (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
              ) : (
                <span />
              )}
              <p className="text-xs" style={{ color: reason.length >= 10 ? 'var(--success)' : 'var(--text-muted)' }}>
                {reason.length}/10
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary min-h-[44px]">
              Batal
            </button>
            <button type="submit" className="btn btn-danger min-h-[44px]">
              <XCircle size={16} aria-hidden="true" /> Tolak Lembur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateModal({
  rates,
  formData,
  onChangeForm,
  onClose,
  onSubmit,
}: {
  rates: OvertimeRate[];
  formData: FormData;
  onChangeForm: (f: FormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ot-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 id="create-ot-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Request Lembur Baru
          </h2>
          <button type="button" onClick={onClose} className="btn btn-icon btn-secondary" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="ot-date" className="label">Tanggal Lembur</label>
            <input
              id="ot-date"
              type="date"
              className="input"
              value={formData.overtimeDate}
              onChange={(e) => onChangeForm({ ...formData, overtimeDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ot-start" className="label">Mulai</label>
              <input
                id="ot-start"
                type="time"
                className="input"
                value={formData.startTime}
                onChange={(e) => {
                  const start = e.target.value;
                  onChangeForm({
                    ...formData,
                    startTime: start,
                    durationHours: formData.endTime ? calculateDuration(start, formData.endTime) : 0,
                  });
                }}
                required
              />
            </div>
            <div>
              <label htmlFor="ot-end" className="label">Selesai</label>
              <input
                id="ot-end"
                type="time"
                className="input"
                value={formData.endTime}
                onChange={(e) => {
                  const end = e.target.value;
                  onChangeForm({
                    ...formData,
                    endTime: end,
                    durationHours: formData.startTime ? calculateDuration(formData.startTime, end) : 0,
                  });
                }}
                required
              />
            </div>
          </div>

          {formData.durationHours > 0 && (
            <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
              Durasi: {formData.durationHours} jam
            </div>
          )}

          <div>
            <label htmlFor="ot-rate" className="label">Rate Lembur</label>
            <select
              id="ot-rate"
              className="input"
              value={formData.rateId}
              onChange={(e) => onChangeForm({ ...formData, rateId: e.target.value })}
              required
            >
              <option value="">Pilih rate lembur</option>
              {rates.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.multiplier}×)</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ot-reason" className="label">Alasan Lembur</label>
            <textarea
              id="ot-reason"
              className="input resize-none"
              rows={3}
              value={formData.reason}
              onChange={(e) => onChangeForm({ ...formData, reason: e.target.value })}
              placeholder="Minimal 10 karakter"
              required
              minLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary min-h-[44px]">
              Batal
            </button>
            <button
              type="submit"
              disabled={formData.durationHours < 0.5}
              className="btn btn-primary min-h-[44px]"
            >
              Simpan Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OvertimePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const queryClient = useQueryClient();
  const { showModal, rejectId, filter, pendingApproveId, feedback, feedbackType, formData } = state;

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['overtime', 'requests', filter],
    queryFn: () => fetchApiList<OvertimeRequest>(
      `/api/overtime/requests${filter !== 'ALL' ? `?status=${filter}` : ''}`,
      'Gagal memuat request lembur',
    ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: ratesData } = useQuery({
    queryKey: ['overtime', 'rates'],
    queryFn: () => fetchApiList<OvertimeRate>('/api/overtime/rates?isActive=true', 'Gagal memuat rate lembur'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const requests = requestsData ?? [];
  const rates = ratesData ?? [];

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['overtime'] });
  }, [queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/overtime/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        dispatch({ type: 'SET_MODAL', showModal: false });
        dispatch({ type: 'RESET_FORM' });
        dispatch({ type: 'SET_FEEDBACK', feedback: 'Request lembur berhasil dibuat.', feedbackType: 'success' });
        invalidate();
      } else {
        const err = await res.json();
        dispatch({ type: 'SET_FEEDBACK', feedback: err.error ?? 'Gagal membuat request.', feedbackType: 'error' });
      }
    } catch {
      dispatch({ type: 'SET_FEEDBACK', feedback: 'Gagal membuat request lembur.', feedbackType: 'error' });
    }
  };

  const handleApprove = async (id: string) => {
    if (pendingApproveId !== id) {
      dispatch({ type: 'SET_PENDING_APPROVE', pendingApproveId: id });
      dispatch({ type: 'SET_FEEDBACK', feedback: 'Klik "Konfirmasi" sekali lagi untuk menyetujui.', feedbackType: 'success' });
      return;
    }
    try {
      const res = await fetch(`/api/overtime/requests/${id}/approve`, { method: 'POST' });
      dispatch({ type: 'SET_PENDING_APPROVE', pendingApproveId: null });
      if (res.ok) {
        dispatch({ type: 'SET_FEEDBACK', feedback: 'Lembur berhasil disetujui.', feedbackType: 'success' });
        invalidate();
      } else {
        const err = await res.json();
        dispatch({ type: 'SET_FEEDBACK', feedback: err.error ?? 'Gagal menyetujui lembur.', feedbackType: 'error' });
      }
    } catch {
      dispatch({ type: 'SET_FEEDBACK', feedback: 'Gagal menyetujui lembur.', feedbackType: 'error' });
    }
  };

  const handleRejectOpen = (id: string) => {
    dispatch({ type: 'SET_REJECT_ID', rejectId: id });
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectId) return;
    try {
      const res = await fetch(`/api/overtime/requests/${rejectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedReason: reason }),
      });
      dispatch({ type: 'SET_REJECT_ID', rejectId: null });
      if (res.ok) {
        dispatch({ type: 'SET_FEEDBACK', feedback: 'Lembur berhasil ditolak.', feedbackType: 'success' });
        invalidate();
      } else {
        const err = await res.json();
        dispatch({ type: 'SET_FEEDBACK', feedback: err.error ?? 'Gagal menolak lembur.', feedbackType: 'error' });
      }
    } catch {
      dispatch({ type: 'SET_FEEDBACK', feedback: 'Gagal menolak lembur.', feedbackType: 'error' });
    }
  };

  return (
    <div className="phone-screen feature-screen flex min-h-full flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => router.back()} aria-label="Kembali">
          <ArrowLeft size={24} aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold">Lembur</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kelola request lembur</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            {rates.length} rate aktif
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => dispatch({ type: 'SET_MODAL', showModal: true })}
          >
            <Plus size={16} aria-hidden="true" /> Request
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <output
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${feedbackType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}
          role={feedbackType === 'error' ? 'alert' : 'status'}
        >
          {feedback}
        </output>
      )}

      {/* Stats */}
      {requestsLoading ? (
        <SkeletonStatsGrid count={4} />
      ) : (
        <StatsCards requests={requests} />
      )}

      {/* Filter tabs */}
      <FilterTabs filter={filter} onSelect={(s) => dispatch({ type: 'SET_FILTER', filter: s })} />

      {/* Requests */}
      {requestsLoading ? (
        <SkeletonList count={3} />
      ) : requests.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Clock}
            title="Belum ada request lembur"
            description="Tekan tombol Request untuk mengajukan lembur baru."
            action={{ label: '+ Request Lembur', onClick: () => dispatch({ type: 'SET_MODAL', showModal: true }) }}
          />
        </div>
      ) : (
        <section className="space-y-3">
          {requests.map((item) => (
            <RequestCard
              key={item.request.id}
              item={item}
              pendingApproveId={pendingApproveId}
              onApprove={handleApprove}
              onReject={handleRejectOpen}
            />
          ))}
        </section>
      )}

      {/* Create modal */}
      {showModal && (
        <CreateModal
          rates={rates}
          formData={formData}
          onChangeForm={(next) => dispatch({ type: 'SET_FORM', formData: next })}
          onClose={() => { dispatch({ type: 'SET_MODAL', showModal: false }); dispatch({ type: 'RESET_FORM' }); }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Reject modal */}
      {rejectId && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onClose={() => dispatch({ type: 'SET_REJECT_ID', rejectId: null })}
        />
      )}
    </div>
  );
}
