"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Plus, Edit, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { getAuthHeaders } from "@/lib/auth-client";

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
  const [formData, setFormData] = useState({
    nip: "",
    fullName: "",
    email: "",
    phone: "",
    division: "",
    position: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
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
    setSelectedEmployee(null);
    setFormData({
      nip: "",
      fullName: "",
      email: "",
      phone: "",
      division: "",
      position: "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      nip: employee.nip,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone || "",
      division: employee.division || "",
      position: employee.position || "",
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
      
      const method = selectedEmployee ? "PATCH" : "POST";
      
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

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Karyawan</h1>
        </div>
      </div>

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
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleEdit(emp)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit size={18} color="var(--text-muted)" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 size={18} color="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={handleCreate}>
        <Plus size={24} />
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
          <Input
            label="NIP"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            required
          />
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
          <Input
            label="Telepon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Divisi"
            value={formData.division}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
          />
          <Input
            label="Posisi"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
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
            <Button variant="danger" onClick={handleDelete} loading={submitting}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Apakah Anda yakin ingin menghapus karyawan <strong>{selectedEmployee?.fullName}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
