'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PayrollStructure {
  id: string;
  name: string;
  description: string | null;
  baseSalary: number;
  isActive: boolean;
  createdAt: string;
}

export default function PayrollStructuresPage() {
  const router = useRouter();
  const [structures, setStructures] = useState<PayrollStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseSalary: 0,
  });

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      const res = await fetch('/api/payroll/structures');
      const data = await res.json();
      if (res.ok) {
        setStructures(data.data);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId
      ? `/api/payroll/structures/${editingId}`
      : '/api/payroll/structures';
    const method = editingId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', description: '', baseSalary: 0 });
        setFeedback('Struktur gaji berhasil disimpan.');
        fetchStructures();
      } else {
        const error = await res.json();
        setFeedback(typeof error.error === 'string' ? error.error : 'Struktur gaji gagal disimpan.');
      }
    } catch {
      setFeedback('Gagal menyimpan struktur gaji. Coba lagi sebentar.');
    }
  };

  const handleEdit = (structure: PayrollStructure) => {
    setEditingId(structure.id);
    setFormData({
      name: structure.name,
      description: structure.description || '',
      baseSalary: structure.baseSalary,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      setFeedback('Klik Hapus sekali lagi untuk konfirmasi.');
      return;
    }

    try {
      const res = await fetch(`/api/payroll/structures/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPendingDeleteId(null);
        setFeedback('Struktur gaji berhasil dihapus.');
        fetchStructures();
      } else {
        const error = await res.json();
        setFeedback(typeof error.error === 'string' ? error.error : 'Struktur gaji gagal dihapus.');
      }
    } catch {
      setFeedback('Gagal menghapus struktur gaji. Coba lagi sebentar.');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/payroll/structures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        setPendingDeleteId(null);
        setFeedback('Struktur gaji berhasil dihapus.');
        fetchStructures();
      }
    } catch {
      setFeedback('Status struktur gaji gagal diubah. Coba lagi sebentar.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        {feedback && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">
            {feedback}
          </div>
        )}
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
            <h1 className="text-3xl font-bold text-gray-900">Struktur Divisi & Gaji</h1>
            <p className="text-gray-600 mt-1">Kelola Divisi, Jabatan, Aturan Gaji, dan Penempatan Karyawan TBM</p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {['Divisi', 'Jabatan', 'Aturan Gaji', 'Penempatan Karyawan'].map((label) => (
                <div key={label} className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm">
                  {label}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500">Belum ada aturan gaji untuk divisi ini.</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', description: '', baseSalary: 0 });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Tambah Struktur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {structures.map((structure) => (
          <div
            key={structure.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{structure.name}</h3>
                {structure.description && (
                  <p className="text-sm text-gray-600 mt-1">{structure.description}</p>
                )}
              </div>
              <button
                onClick={() => toggleActive(structure.id, structure.isActive)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  structure.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {structure.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Gaji Pokok</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(structure.baseSalary)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(structure)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(structure.id)}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                {pendingDeleteId === structure.id ? 'Konfirmasi Hapus' : 'Hapus'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {structures.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada struktur gaji</h3>
          <p className="mt-1 text-sm text-gray-500">Mulai dengan membuat struktur gaji baru</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Struktur Gaji' : 'Tambah Struktur Gaji'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Struktur
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gaji Pokok (Rp)
                </label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, baseSalary: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({ name: '', description: '', baseSalary: 0 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
