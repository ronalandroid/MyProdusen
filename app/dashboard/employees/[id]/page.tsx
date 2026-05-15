"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Briefcase, MapPin, Calendar, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getAuthHeaders, fetchProfile } from "@/lib/auth-client";

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
  joinDate: string;
  address?: string | null;
  user?: {
    role: string;
  };
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkRole();
    fetchEmployee();
  }, [resolvedParams.id]);

  const checkRole = async () => {
    try {
      const profile = await fetchProfile();
      setIsSuperadmin(profile.role === 'SUPERADMIN');
    } catch (err) {
      setIsSuperadmin(false);
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${resolvedParams.id}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmployee(data.data);
        setSelectedRole(data.data.user?.role || 'EMPLOYEE');
      } else {
        showError(data.error || "Gagal memuat data karyawan");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!employee) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${employee.id}/role`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (data.success) {
        success(data.message || "Role berhasil diubah");
        setIsRoleModalOpen(false);
        fetchEmployee();
      } else {
        showError(data.error || "Gagal mengubah role");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat mengubah role");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      SUPERADMIN: { label: "Superadmin", className: "badge-danger" },
      ADMIN_HR: { label: "Admin HR", className: "badge-warning" },
      SUPERVISOR: { label: "Supervisor", className: "badge-info" },
      EMPLOYEE: { label: "Karyawan", className: "badge-success" },
    };
    
    const roleInfo = roleMap[role] || { label: role, className: "" };
    return <span className={`badge ${roleInfo.className}`}>{roleInfo.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: "Aktif", className: "badge-success" },
      INACTIVE: { label: "Nonaktif", className: "badge-danger" },
      ON_LEAVE: { label: "Cuti", className: "badge-warning" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "" };
    return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat data karyawan..." />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Karyawan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Detail Karyawan</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div className="avatar" style={{ width: "80px", height: "80px", fontSize: "24px" }}>
            {employee.profilePhoto ? (
              <img src={employee.profilePhoto} alt={employee.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              employee.fullName.substring(0, 2).toUpperCase()
            )}
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{employee.fullName}</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>{employee.nip}</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {getStatusBadge(employee.status)}
              {employee.user?.role && getRoleBadge(employee.user.role)}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
            <Mail size={20} color="var(--text-muted)" style={{ marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>Email</p>
              <p style={{ fontSize: "14px", fontWeight: 500 }}>{employee.email}</p>
            </div>
          </div>

          {employee.phone && (
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <Phone size={20} color="var(--text-muted)" style={{ marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>Telepon</p>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{employee.phone}</p>
              </div>
            </div>
          )}

          {employee.division && (
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <Briefcase size={20} color="var(--text-muted)" style={{ marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>Divisi</p>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{employee.division}</p>
              </div>
            </div>
          )}

          {employee.position && (
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <User size={20} color="var(--text-muted)" style={{ marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>Posisi</p>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{employee.position}</p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
            <Calendar size={20} color="var(--text-muted)" style={{ marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>Tanggal Bergabung</p>
              <p style={{ fontSize: "14px", fontWeight: 500 }}>
                {new Date(employee.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {employee.address && (
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <MapPin size={20} color="var(--text-muted)" style={{ marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>Alamat</p>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{employee.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Management - Superadmin Only */}
      {isSuperadmin && (
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Shield size={20} color="var(--warning)" />
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Manajemen Role</h3>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Hanya Superadmin yang dapat mengubah role pengguna. Role menentukan akses dan fitur yang tersedia.
          </p>
          <Button onClick={() => setIsRoleModalOpen(true)}>
            Ubah Role
          </Button>
        </div>
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Ubah Role Pengguna"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleChangeRole} loading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Pilih role untuk <strong>{employee.fullName}</strong>:
          </p>
          <select
            className="input"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ appearance: "none", backgroundColor: "white" }}
          >
            <option value="EMPLOYEE">Karyawan</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN_HR">Admin HR</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
          <div className="text-xs text-[var(--text-secondary)]">
            <p><strong>Karyawan:</strong> Akses personal (absensi, cuti, KPI sendiri)</p>
            <p><strong>Supervisor:</strong> Kelola tim, input KPI tim, approve cuti tim</p>
            <p><strong>Admin HR:</strong> Kelola karyawan, absensi, cuti, shift, lokasi</p>
            <p><strong>Superadmin:</strong> Akses penuh termasuk audit dan manajemen role</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
