"use client";

import { useState } from "react";
import { ArrowLeft, FileText, RefreshCcw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData } from "@/hooks/useDashboardQueries";

interface EmployeeDocument {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  expiryDate?: string | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "OTHER",
    title: "",
    description: "",
    expiryDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useQuery<EmployeeDocument[]>({
    queryKey: ["documents"],
    queryFn: () => fetchApiData<EmployeeDocument[]>('/api/documents', 'Dokumen gagal dimuat'),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  const documents = documentsData ?? [];
  const loading = documentsLoading;
  const error = submitError || documentsError?.message || "";

  const loadDocuments = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const createDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      if (!selectedFile) {
        throw new Error('Pilih file dokumen terlebih dahulu');
      }

      const body = new FormData();
      body.append('file', selectedFile);
      body.append('category', formData.category);
      body.append('title', formData.title || selectedFile.name);
      body.append('description', formData.description);
      if (formData.expiryDate) body.append('expiryDate', formData.expiryDate);

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body,
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Dokumen gagal disimpan');
      }

      setIsModalOpen(false);
      setSelectedFile(null);
      setFormData({ category: "OTHER", title: "", description: "", expiryDate: "" });
      await loadDocuments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Dokumen gagal disimpan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)]">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Dokumen Karyawan</span>
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadDocuments} disabled={loading}>
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Tambah Dokumen</Button>
        </div>
      </header>

      <div className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <ShieldCheck size={22} color="var(--success)" />
        <div>
          <p className="text-sm font-semibold">Akses dokumen dibatasi</p>
          <p className="text-xs text-[var(--text-secondary)]">Karyawan hanya melihat dokumennya sendiri. HR/Superadmin dapat mengelola dokumen karyawan sesuai RBAC.</p>
        </div>
      </div>

      {error && (
        <div className="card" role="alert" style={{ padding: "16px", borderColor: "var(--danger)" }}>
          <p className="font-semibold text-[var(--danger)]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Memuat dokumen..." />
        </div>
      ) : documents.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "24px", textAlign: "center" }}>
          <FileText size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold">Belum ada dokumen</h2>
          <p className="text-sm text-[var(--text-secondary)]">Kontrak, sertifikat, identitas, dan dokumen HR akan tampil di sini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <article key={document.id} className="card" style={{ padding: "16px" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{document.category}</p>
                  <h2 className="text-base font-semibold">{document.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{document.description || document.fileName}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">{document.mimeType} • {(document.fileSize / 1024).toFixed(1)} KB</p>
                </div>
                <a className="text-link text-sm" href={document.fileUrl} target="_blank" rel="noreferrer">Buka</a>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Dokumen" size="lg">
        <form onSubmit={createDocument} className="flex flex-col gap-4">
          <Input label="Judul" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Kategori</label>
            <select className="input" value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })}>
              <option value="CONTRACT">Kontrak</option>
              <option value="CERTIFICATE">Sertifikat</option>
              <option value="ID">Identitas</option>
              <option value="EDUCATION">Pendidikan</option>
              <option value="MEDICAL">Medis</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">File Dokumen</label>
            <input
              className="input"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">PDF, JPEG, PNG, WebP. Maksimal 10MB.</p>
          </div>
          <Input label="Tanggal Expired" type="date" value={formData.expiryDate} onChange={(event) => setFormData({ ...formData, expiryDate: event.target.value })} />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Deskripsi</label>
            <textarea className="input" rows={3} value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
          </div>
          <Button type="submit" loading={submitting}>Simpan Dokumen</Button>
        </form>
      </Modal>
    </div>
  );
}
