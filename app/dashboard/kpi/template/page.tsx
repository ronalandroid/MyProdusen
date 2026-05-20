"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const currentPeriod = new Date().toISOString().slice(0, 7);

type TemplateRow = { id: string; name: string; description?: string | null };
type EmployeeRow = { id: string; name?: string; fullName?: string; nip?: string | null };

export default function KpiTemplatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [period, setPeriod] = useState(currentPeriod);
  const [name, setName] = useState(`Template KPI ${currentPeriod}`);
  const [description, setDescription] = useState("Template KPI operasional bulanan");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actualValue, setActualValue] = useState("100");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [templateResponse, employeeResponse] = await Promise.all([
        fetch("/api/kpi/templates?isActive=true", { credentials: "include", cache: "no-store" }),
        fetch("/api/employees?limit=100", { credentials: "include", cache: "no-store" }),
      ]);
      const [templatePayload, employeePayload] = await Promise.all([
        templateResponse.json().catch(() => null),
        employeeResponse.json().catch(() => null),
      ]);
      if (!templateResponse.ok || !templatePayload?.success) throw new Error(templatePayload?.error || "Gagal mengambil template KPI");
      if (!employeeResponse.ok || !employeePayload?.success) throw new Error(employeePayload?.error || "Gagal mengambil karyawan");
      const nextTemplates = Array.isArray(templatePayload.data) ? templatePayload.data : [];
      const nextEmployees = Array.isArray(employeePayload.data) ? employeePayload.data : [];
      setTemplates(nextTemplates);
      setEmployees(nextEmployees);
      setSelectedTemplateId((current) => current || nextTemplates[0]?.id || "");
      setSelectedEmployeeId((current) => current || nextEmployees[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat KPI template");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting("template");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/kpi/templates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Gagal membuat template KPI");
      setMessage("Template KPI berhasil dibuat.");
      setSelectedTemplateId(payload.data.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat template KPI");
    } finally {
      setSubmitting("");
    }
  }

  async function assignTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting("assign");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/kpi/assignments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplateId, employeeId: selectedEmployeeId, period }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Gagal assign KPI");
      setMessage("Template KPI berhasil di-assign ke karyawan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal assign KPI");
    } finally {
      setSubmitting("");
    }
  }

  async function submitAndApproveResult(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting("result");
    setError("");
    setMessage("");
    try {
      const templateResponse = await fetch(`/api/kpi/templates/${selectedTemplateId}`, { credentials: "include", cache: "no-store" });
      const templatePayload = await templateResponse.json().catch(() => null);
      if (!templateResponse.ok || !templatePayload?.success) throw new Error(templatePayload?.error || "Gagal mengambil item KPI");
      const itemId = templatePayload.data?.items?.[0]?.id;
      if (!itemId) throw new Error("Template KPI belum memiliki item KPI");

      const resultResponse = await fetch("/api/kpi/results", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployeeId, itemId, period, actualValue: Number(actualValue), notes: "Input hasil KPI dari UI Superadmin" }),
      });
      const resultPayload = await resultResponse.json().catch(() => null);
      if (!resultResponse.ok || !resultPayload?.success) throw new Error(resultPayload?.error || "Gagal submit hasil KPI");

      const approveResponse = await fetch(`/api/kpi/results/${resultPayload.data.id}/approve`, { method: "POST", credentials: "include" });
      const approvePayload = await approveResponse.json().catch(() => null);
      if (!approveResponse.ok || !approvePayload?.success) throw new Error(approvePayload?.error || "Gagal approve hasil KPI");
      setMessage("Hasil KPI berhasil dibuat dan approved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal submit hasil KPI");
    } finally {
      setSubmitting("");
    }
  }

  return (
    <main className="phone-screen feature-screen flex flex-col gap-5" aria-labelledby="kpi-template-title">
      <button type="button" className="flex min-h-[44px] items-center gap-3 text-left" onClick={() => router.push("/dashboard/kpi")}>
        <ArrowLeft size={24} aria-hidden="true" />
        <span id="kpi-template-title" className="text-xl font-bold">Template KPI & Assignment</span>
      </button>

      {message && <section className="card border-[var(--success)] text-[var(--success)]" role="status">{message}</section>}
      {error && <section className="alert-card" role="alert"><strong>Gagal</strong><p>{error}</p></section>}
      {loading && <section className="card" role="status">Memuat template KPI...</section>}

      <form className="card flex flex-col gap-4" onSubmit={createTemplate}>
        <h2 className="text-lg font-bold">Create Template KPI</h2>
        <Input label="Nama Template KPI" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="Deskripsi" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Button type="submit" loading={submitting === "template"}>Buat Template KPI</Button>
      </form>

      <form className="card flex flex-col gap-4" onSubmit={assignTemplate}>
        <h2 className="text-lg font-bold">Assign Template KPI</h2>
        <label className="label" htmlFor="template-select">Template KPI</label>
        <select id="template-select" className="input" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} required>
          <option value="">Pilih template</option>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
        <label className="label" htmlFor="employee-select">Karyawan</label>
        <select id="employee-select" className="input" value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} required>
          <option value="">Pilih karyawan</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName || employee.name}{employee.nip ? ` — ${employee.nip}` : ""}</option>)}
        </select>
        <Input label="Periode" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} required />
        <Button type="submit" loading={submitting === "assign"}>Assign KPI</Button>
      </form>

      <form className="card flex flex-col gap-4" onSubmit={submitAndApproveResult}>
        <h2 className="text-lg font-bold">Create & Approve KPI Result</h2>
        <p className="text-sm text-[var(--text-secondary)]">Gunakan template dan karyawan terpilih untuk input hasil KPI lalu approve.</p>
        <Input label="Actual Value" type="number" value={actualValue} onChange={(event) => setActualValue(event.target.value)} required />
        <Button type="submit" loading={submitting === "result"}>Submit dan Approve KPI Result</Button>
      </form>
    </main>
  );
}
