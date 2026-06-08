'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchApiData } from '@/hooks/useDashboardQueries';

interface PayrollItem {
  item: {
    id: string;
    baseSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    overtimePay: number;
    attendanceDeduction: number;
    taxAmount: number;
    bpjsKesehatanEmployee: number;
    bpjsKetenagakerjaanEmployee: number;
    grossPay: number;
    netPay: number;
    workDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
  };
  employee: {
    id: string;
    nip: string;
    fullName: string;
    position: string;
    division: string;
  };
}


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };


const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
  };

interface PayrollRun {
  id: string;
  period: string;
  status: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  items: PayrollItem[];
}

export default function PayrollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const {
    data: payrollRunData,
    isPending: payrollRunPending,
  } = useQuery({
    queryKey: ['payroll-run', id],
    queryFn: () => fetchApiData<PayrollRun>(`/api/payroll/runs/${id}`, 'Payroll run tidak ditemukan'),
    enabled: Boolean(id),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const run = payrollRunData || null;
  const loading = payrollRunPending;

  const filteredItems = run?.items.filter((item) =>
    item.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employee.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Payroll run tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payroll {formatPeriod(run.period)}
            </h1>
            <p className="text-gray-600 mt-1">Detail penggajian periode {run.period}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/api/payroll/runs/${run.id}/export`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </a>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600">Total Karyawan</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{run.totalEmployees}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600">Total Gross Pay</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {formatCurrency(run.totalGrossPay)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600">Total Potongan</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(run.totalDeductions)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600">Total Net Pay</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(run.totalNetPay)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari karyawan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Payroll Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Karyawan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Gaji Pokok
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tunjangan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Lembur
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Potongan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Kehadiran
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Payslip
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems?.map((item) => (
                <tr key={item.item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.employee.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.employee.nip} • {item.employee.position}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(item.item.baseSalary)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">
                    +{formatCurrency(item.item.totalAllowances)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">
                    +{formatCurrency(item.item.overtimePay)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">
                    {formatCurrency(item.item.grossPay)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-red-600">
                    -{formatCurrency(item.item.totalDeductions)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    {formatCurrency(item.item.netPay)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-xs text-gray-600">
                      <div>Kerja: {item.item.workDays} hari</div>
                      <div>Absen: {item.item.absentDays} hari</div>
                      <div>Terlambat: {item.item.lateDays} hari</div>
                      {item.item.overtimeHours > 0 && (
                        <div className="text-blue-600">
                          Lembur: {item.item.overtimeHours} jam
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a className="text-sm font-semibold text-blue-600 hover:text-blue-800" href={`/api/payroll/payslips/${item.item.id}`}>
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
