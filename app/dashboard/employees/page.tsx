"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Plus, Edit, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { fetchProfile, getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";

interface Employee {
  id: string;
  nip: string;
  fullName: string;
  email: string;
  phone?: string | null;
  division?: string | null;
  position?: string | null;
  status: string;
  profilePhoto?: string | null;
}

const accessRoleOptions = [
  { value: "EMPLOYEE", label: "Karyawan", description: "Akses pribadi: absensi, cuti, KPI sendiri" },
  { value: "SUPERADMIN", label: "Superadmin", description: "Akses penuh owner/superadmin" },
] as const;

const divisionOptions = ["HR", "Produksi", "Packing", "Sales", "Expedition", "Finance", "Operational"];
const positionOptions = ["Admin", "Leader", "Staff", "Driver", "Manager", "Operator"];

export default function EmployeesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [accessNotice, setAccessNotice] = useState("");
  const [formData, setFormData] = useState({
    nip: "",
    fullName: "",
    email: "",
    username: "",
    phone: "",
    division: "",
    position: "",
    role: "EMPLOYEE",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(handle);
  }, [statusFilter, searchTerm]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch.length >= 2) {
        params.append("search", trimmedSearch);
      }
      
      const response = await fetch(`/api/employees?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data || []);
      } else {
        showError(data.error || "Gagal memuat data karyawan");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (profile?.role === "EMPLOYEE") {
      setAccessNotice("Akses ditolak. Karyawan hanya dapat melihat data sendiri dan tidak dapat menambah data karyawan.");
      return;
    }
    setSelectedEmployee(null);
    setFormData({
      nip: "",
      fullName: "",
      email: "",
      username: "",
      phone: "",
      division: "",
      position: "",
      role: "EMPLOYEE",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    if (!canManageEmployees) {
      setAccessNotice("Akses ditolak. Karyawan hanya dapat melihat data sendiri dan tidak dapat membuka data karyawan lain.");
      return;
    }
    if (profile?.role === "EMPLOYEE" && employee.id !== profile.employee?.id) {
      setAccessNotice("Akses ditolak. Karyawan hanya dapat melihat data sendiri dan tidak dapat membuka data karyawan lain.");
      return;
    }
    if (profile?.role === "EMPLOYEE") {
      setAccessNotice("Akses dibatasi. Karyawan hanya dapat melihat data sendiri; perubahan profil dilakukan melalui menu Profil.");
      return;
    }
    setSelectedEmployee(employee);
    setFormData({
      nip: employee.nip,
      fullName: employee.fullName,
      email: employee.email,
      username: "",
      phone: employee.phone || "",
      division: employee.division || "",
      position: employee.position || "",
      role: "EMPLOYEE",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = selectedEmployee
        ? `/api/employees/${selectedEmployee.id}`
        : "/api/employees";
      
      const method = selectedEmployee ? "PUT" : "POST";
      
      const payload = selectedEmployee
        ? { ...formData, password: formData.password || undefined }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        success(data.message || "Berhasil menyimpan data karyawan");
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        showError(data.error || "Gagal menyimpan data");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        success(data.message || "Karyawan berhasil dihapus");
        setIsDeleteModalOpen(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        showError(data.error || "Gagal menghapus karyawan");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat menghapus data");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(searchLower) ||
      emp.nip.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: "Aktif", className: "badge-success" },
      INACTIVE: { label: "Nonaktif", className: "badge-danger" },
      ON_LEAVE: { label: "Cuti", className: "badge-warning" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "" };
    return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const canManageEmployees = profile?.role === "SUPERADMIN";

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Karyawan</h1>
        </div>
      </div>

      <section className="sync-strip" aria-label="Alur data karyawan dan NIP">
        <span>Frontend</span><span aria-hidden="true">→</span><span>/api/employees</span><span aria-hidden="true">→</span><span>Employee Service</span><span aria-hidden="true">→</span><span>Drizzle</span><span aria-hidden="true">→</span><span>PostgreSQL</span>
      </section>

      <section className="card" aria-labelledby="employee-sync-title" style={{ padding: "16px", borderColor: "rgba(255,193,7,.42)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Core HR Sync</p>
            <h2 id="employee-sync-title" className="text-lg font-bold">NIP otomatis, user akun, shift, lokasi</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Data karyawan tersimpan melalui service dan Drizzle. NIP stabil, unik, tidak dipakai ulang, dan role produksi hanya Superadmin atau Karyawan.</p>
          </div>
          <span className="badge badge-primary">MPD-YYYY-DIV-SEQ</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="api-pill">API: /api/employees</span>
          <span className="api-pill">API: /api/users</span>
          <span className="api-pill">DB: Employee_defaultShiftId_idx</span>
          <span className="api-pill">DB: Employee_defaultLocationId_idx</span>
        </div>
      </section>

      {profile?.role === "EMPLOYEE" && (
        <div className="card" role="status" style={{ padding: "12px 16px", borderColor: "var(--border-color)" }}>
          <p className="text-sm font-semibold">Akses dibatasi</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Karyawan hanya dapat melihat data sendiri. Data karyawan lain tidak dapat diedit atau dihapus.</p>
        </div>
      )}

      {accessNotice && (
        <div className="card" role="alert" style={{ padding: "12px 16px", borderColor: "var(--danger)", backgroundColor: "var(--danger-bg)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>{accessNotice}</p>
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Input
          placeholder="Cari nama, NIP, atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
        />
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ appearance: "none", backgroundColor: "white" }}
        >
          <option value="all">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
          <option value="ON_LEAVE">Cuti</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Memuat data karyawan..." />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          {searchTerm ? "Tidak ada karyawan yang sesuai dengan pencarian" : "Belum ada data karyawan"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" }}>
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <div className="avatar" style={{ width: "40px", height: "40px", fontSize: "14px" }}>
                  {emp.profilePhoto ? (
                    <img src={emp.profilePhoto} alt={emp.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    emp.fullName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{emp.fullName}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {emp.position || "—"} {emp.division ? `• ${emp.division}` : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{emp.nip}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>•</span>
                    {getStatusBadge(emp.status)}
                  </div>
                </div>
              </div>
              {canManageEmployees ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(emp)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={`Edit ${emp.fullName}`}
                  >
                    <Edit size={18} color="var(--text-muted)" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={`Hapus ${emp.fullName}`}
                  >
                    <Trash2 size={18} color="var(--danger)" />
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={() => handleEdit(emp)} style={{ minHeight: "44px", padding: "8px 12px", fontSize: "12px" }}>
                  Lihat batas akses
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={handleCreate} aria-label="Tambah karyawan baru">
        <Plus size={24} aria-hidden="true" />
      </button>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {selectedEmployee ? (
            <Input
              label="NIP"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              disabled
            />
          ) : (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--text-primary)]">NIP dibuat otomatis</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Format mengikuti aturan perusahaan, misalnya MPD-2026-PRD-0001.</p>
            </div>
          )}
          <Input
            label="Nama Lengkap"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {!selectedEmployee && (
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="contoh: deni.leader"
              required
            />
          )}
          <Input
            label="Telepon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          {!selectedEmployee && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Role Akses Sistem</label>
              <select
                className="input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                {accessRoleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-secondary)]">
                {accessRoleOptions.find((role) => role.value === formData.role)?.description}
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Divisi / Bagian</label>
              <input
                className="input"
                list="division-options"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                placeholder="contoh: Expedition"
              />
              <datalist id="division-options">
                {divisionOptions.map((division) => <option key={division} value={division} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Jabatan / Posisi</label>
              <input
                className="input"
                list="position-options"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="contoh: Leader"
              />
              <datalist id="position-options">
                {positionOptions.map((position) => <option key={position} value={position} />)}
              </datalist>
            </div>
          </div>
          <Input
            label={selectedEmployee ? "Password (kosongkan jika tidak diubah)" : "Password"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!selectedEmployee}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Karyawan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting} disabled={!selectedEmployee || submitting}>
              Hapus
            </Button>
          </>
        }
      >
        {selectedEmployee ? (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Apakah Anda yakin ingin menghapus karyawan <strong>{selectedEmployee.fullName}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Data karyawan tidak tersedia. Tutup dialog lalu pilih karyawan kembali.
          </p>
        )}
      </Modal>
    </div>
  );
}
