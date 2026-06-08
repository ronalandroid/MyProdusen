'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fetchProfile } from '@/lib/auth-client';
import { fetchApiData } from '@/hooks/useDashboardQueries';

type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';

interface PayrollRun {
  id: string;
  period: string;
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}


const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);


const formatPeriod = (period: string) => {
    const [year, month] = period.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
  };

interface EmployeePayrollItem {
  item: { id: string; netPay: number; grossPay: number; totalDeductions: number };
  run: { period: string; status: PayrollStatus };
}

const EMPTY_PAYROLL_RUNS: PayrollRun[] = [];
const EMPTY_EMPLOYEE_PAYROLL_ITEMS: EmployeePayrollItem[] = [];

export default function PayrollPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newPeriod, setNewPeriod] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [mutateError, setError] = useState('');

  const { data: roleData, isLoading: roleLoading, error: roleError } = useQuery<string>({
    queryKey: ['payroll', 'role'],
    queryFn: async () => (await fetchProfile()).role,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
  const role = roleData ?? '';
  const isEmployee = role === 'EMPLOYEE';
  const canMutate = role === 'SUPERADMIN';
  const canApproveOrPay = role === 'SUPERADMIN';

  const { data: payrollData, isLoading: payrollLoading, error: payrollError } = useQuery<PayrollRun[] | EmployeePayrollItem[]>({
    queryKey: ['payroll', 'list', role],
    queryFn: () =>
      fetchApiData<PayrollRun[] | EmployeePayrollItem[]>(
        isEmployee ? '/api/payroll/me' : '/api/payroll/runs',
        'Gagal memuat payroll',
      ),
    enabled: Boolean(role),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  const runs = (isEmployee ? EMPTY_PAYROLL_RUNS : (payrollData as PayrollRun[] | undefined)) ?? EMPTY_PAYROLL_RUNS;
  const myItems = (isEmployee ? (payrollData as EmployeePayrollItem[] | undefined) : EMPTY_EMPLOYEE_PAYROLL_ITEMS) ?? EMPTY_EMPLOYEE_PAYROLL_ITEMS;
  const loading = roleLoading || (Boolean(role) && payrollLoading);
  const error = mutateError || roleError?.message || payrollError?.message || '';

  async function createPayrollRun() {
    if (!newPeriod) return;
    const [year, month] = newPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1).toISOString();
    const periodEnd = new Date(year, month, 0).toISOString();
    await mutate('create', '/api/payroll/runs', { period: newPeriod, periodStart, periodEnd });
    setNewPeriod('');
  }

  async function mutate(key: string, endpoint: string, body?: unknown) {
    setSubmitting(key);
    setError('');
    setMessage('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Aksi payroll gagal');
      setMessage(payload.message || 'Aksi payroll berhasil');
      await queryClient.invalidateQueries({ queryKey: ['payroll', 'list'] });
    } catch (err: any) {
      setError(err.message || 'Aksi payroll gagal');
    } finally {
      setSubmitting(null);
    }
  }

  const summary = useMemo(() => ({
    totalRuns: runs.length,
    pendingApproval: runs.filter((run) => run.status === 'CALCULATED').length,
    approved: runs.filter((run) => run.status === 'APPROVED').length,
    paid: runs.filter((run) => run.status === 'PAID').length,
  }), [runs]);

  if (loading) return <LoadingSpinner fullScreen message="Memuat payroll..." />;

  if (isEmployee) {
    return (
      <div className="phone-screen feature-screen">
        <section className="hero-card"><h1 className="text-xl font-bold text-white">Payroll Saya</h1><p className="text-sm text-white/90">Lihat slip gaji pribadi. Data karyawan lain tidak ditampilkan.</p></section>
        {error && <div className="alert-card" role="alert"><strong>Gagal</strong><p>{error}</p></div>}
        <section className="card">
          <h2 className="text-base font-bold mb-4">Riwayat Payslip</h2>
          {myItems.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4" role="status">
              <p className="text-sm font-semibold">Slip gaji / payroll pribadi belum diterbitkan.</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Halaman ini hanya menampilkan payroll milik akun login saat ini. Data payroll karyawan lain tetap terlindungi.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myItems.map(({ item, run }) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border-color)] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-bold">{formatPeriod(run.period)}</p><p className="text-xs text-[var(--text-secondary)]">Status {run.status} • Net {formatCurrency(item.netPay)}</p></div>
                  <a className="btn btn-primary" href={`/api/payroll/payslips/${item.id}`}>Download Payslip</a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="phone-screen feature-screen">
      <section className="hero-card">
        <div><p className="eyebrow text-white/80">Payroll aktif</p><h1 className="text-2xl font-bold text-white">Payroll Management</h1><p className="text-sm text-white/90">Generate, kalkulasi, approve, paid, export CSV, dan payslip.</p></div>
      </section>

      {error && <div className="alert-card" role="alert"><strong>Gagal</strong><p>{error}</p></div>}
      {message && <div className="card border-[var(--success)] text-[var(--success)]" role="status">{message}</div>}

      <section className="card" aria-label="Payroll pribadi dan notifikasi saat ini">
        <h2 className="text-base font-bold">Slip gaji pribadi & notifikasi saat ini</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Gaji / Penggajian akun login tersambung ke menu payroll, payslip, slip gaji, dan Notifikasi.</p>
        <div className="mt-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4" role="status">
          <p className="text-sm font-semibold">Slip gaji pribadi</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Payslip personal muncul di sini saat payroll sudah diterbitkan. Data pengguna lain tidak ditampilkan.</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/dashboard/payroll/me')}>Buka Gaji Saya</button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/dashboard/notifications')}>Buka Notifikasi Saat Ini</button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stat-card"><p>Total Runs</p><strong>{summary.totalRuns}</strong></div>
        <div className="stat-card"><p>Need Approval</p><strong>{summary.pendingApproval}</strong></div>
        <div className="stat-card"><p>Approved</p><strong>{summary.approved}</strong></div>
        <div className="stat-card"><p>Paid</p><strong>{summary.paid}</strong></div>
      </section>

      {canMutate && (
        <section className="card flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><label className="block text-sm font-semibold mb-2" htmlFor="payroll-period">Periode payroll</label><input id="payroll-period" className="input" type="month" value={newPeriod} onChange={(event) => setNewPeriod(event.target.value)} /></div>
          <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={() => router.push('/dashboard/payroll/structures')} variant="secondary">Struktur Gaji</Button><Button onClick={createPayrollRun} disabled={!newPeriod} loading={submitting === 'create'}>Buat Payroll</Button></div>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-bold mb-4">Payroll Runs</h2>
        {runs.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Belum ada payroll run.</p> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Periode</th><th>Status</th><th>Karyawan</th><th>Net Pay</th><th>Aksi</th></tr></thead>
              <tbody>{runs.map((run) => (
                <tr key={run.id}>
                  <td><strong>{formatPeriod(run.period)}</strong><br /><span className="text-xs text-[var(--text-secondary)]">{run.period}</span></td>
                  <td><span className="badge badge-info">{run.status}</span></td>
                  <td>{run.totalEmployees}</td>
                  <td>{formatCurrency(run.totalNetPay)}</td>
                  <td><div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/payroll/${run.id}`)}>Detail</Button>
                    {run.status === 'DRAFT' && canMutate && <Button size="sm" onClick={() => mutate(`calculate-${run.id}`, `/api/payroll/runs/${run.id}/calculate`)} loading={submitting === `calculate-${run.id}`}>Calculate</Button>}
                    {run.status === 'CALCULATED' && canApproveOrPay && <Button size="sm" onClick={() => mutate(`approve-${run.id}`, `/api/payroll/runs/${run.id}/approve`)} loading={submitting === `approve-${run.id}`}>Approve</Button>}
                    {run.status === 'APPROVED' && canApproveOrPay && <Button size="sm" variant="success" onClick={() => mutate(`paid-${run.id}`, `/api/payroll/runs/${run.id}/paid`)} loading={submitting === `paid-${run.id}`}>Mark Paid</Button>}
                    <a className="btn btn-secondary btn-sm" href={`/api/payroll/runs/${run.id}/export`}>CSV</a>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
