"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";

type Employee = { id: string; fullName: string; nip?: string; division?: string | null };
type Shift = { id: string; name: string; startTime: string; endTime: string; isActive: boolean };
type WorkLocation = { id: string; name: string; address: string; isActive: boolean };

type ScheduleRow = {
  id: string;
  employeeId: string;
  date: string;
  shiftId: string;
  shiftName: string | null;
  workLocationIds: string[];
};

type Tab = "schedules" | "shift-locations";

const EMPTY_EMPLOYEES: Employee[] = [];
const EMPTY_SHIFTS: Shift[] = [];
const EMPTY_LOCATIONS: WorkLocation[] = [];
const EMPTY_SCHEDULES: ScheduleRow[] = [];
const EMPTY_WORK_LOCATION_IDS: string[] = [];

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const tz = d.getTime() - d.getTimezoneOffset() * 60_000;
  return new Date(tz).toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const tz = d.getTime() - d.getTimezoneOffset() * 60_000;
  return new Date(tz).toISOString().slice(0, 10);
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Permintaan gagal");
  }
  return result.data as T;
}

export default function AttendanceSchedulesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("schedules");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { data: masterData, isPending: masterPending, error: masterError } = useQuery({
    queryKey: ["attendance-schedules-master"],
    queryFn: async () => {
      const [emp, shf, loc] = await Promise.all([
        fetchApiData<any>("/api/employees?status=ACTIVE", "Gagal memuat data master"),
        fetchApiList<Shift>("/api/shifts", "Gagal memuat data master"),
        fetchApiList<WorkLocation>("/api/work-locations?isActive=true", "Gagal memuat data master"),
      ]);
      const empItems: Employee[] = Array.isArray(emp) ? emp : Array.isArray(emp?.items) ? emp.items : [];
      return {
        employees: empItems,
        shifts: Array.isArray(shf) ? shf : [],
        locations: Array.isArray(loc) ? loc : [],
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const employees = masterData?.employees ?? EMPTY_EMPLOYEES;
  const shifts = masterData?.shifts ?? EMPTY_SHIFTS;
  const locations = masterData?.locations ?? EMPTY_LOCATIONS;
  const loadingMaster = masterPending;

  const activeShifts = useMemo(() => shifts.filter((s) => s.isActive), [shifts]);
  const activeLocations = useMemo(() => locations.filter((l) => l.isActive), [locations]);
  const locationNameById = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name] as const)),
    [locations],
  );
  const employeeNameById = useMemo(
    () => new Map(employees.map((e) => [e.id, e.fullName] as const)),
    [employees],
  );

  function loadMaster() {
    queryClient.invalidateQueries({ queryKey: ["attendance-schedules-master"] });
  }

  // ---- Tab 1: per-day schedule assignment ----
  const [form, setForm] = useState({
    employeeId: "",
    date: todayIso(),
    shiftId: "",
    workLocationIds: [] as string[],
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [rangeFrom, setRangeFrom] = useState(() => todayIso());
  const [rangeTo, setRangeTo] = useState(() => addDaysIso(todayIso(), 6));
  const [filterEmployee, setFilterEmployee] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: schedulesData, isPending: schedulesPending, error: schedulesError } = useQuery({
    queryKey: ["attendance-schedules", rangeFrom, rangeTo, filterEmployee],
    queryFn: () => {
      const params = new URLSearchParams({ from: rangeFrom, to: rangeTo });
      if (filterEmployee) params.set("employeeId", filterEmployee);
      return fetchApiData<{ schedules: ScheduleRow[] }>(
        `/api/attendance/schedules?${params.toString()}`,
        "Gagal memuat jadwal",
      );
    },
    enabled: tab === "schedules" && !loadingMaster,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const schedules = useMemo(() => {
    const rows = (schedulesData?.schedules || EMPTY_SCHEDULES).slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const an = employeeNameById.get(a.employeeId) || "";
      const bn = employeeNameById.get(b.employeeId) || "";
      return an.localeCompare(bn);
    });
    return rows;
  }, [schedulesData, employeeNameById]);
  const loadingSchedules = schedulesPending;

  function loadSchedules() {
    queryClient.invalidateQueries({ queryKey: ["attendance-schedules"] });
  }

  function toggleFormLocation(id: string) {
    setForm((current) => ({
      ...current,
      workLocationIds: current.workLocationIds.includes(id)
        ? current.workLocationIds.filter((x) => x !== id)
        : [...current.workLocationIds, id],
    }));
  }

  async function submitSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.employeeId || !form.shiftId || form.workLocationIds.length === 0) {
      setError("Lengkapi karyawan, shift, dan minimal satu lokasi kerja.");
      return;
    }
    setSavingSchedule(true);
    try {
      await api("/api/attendance/schedules", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage(`Jadwal ${employeeNameById.get(form.employeeId) || ""} untuk ${form.date} tersimpan.`);
      setForm((current) => ({ ...current, shiftId: "", workLocationIds: [] }));
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jadwal");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function deleteSchedule(row: ScheduleRow) {
    if (!window.confirm(`Hapus jadwal ${employeeNameById.get(row.employeeId) || ""} pada ${row.date}?`)) {
      return;
    }
    setDeletingId(row.id);
    setError("");
    setMessage("");
    try {
      await api(`/api/attendance/schedules/${row.id}`, { method: "DELETE" });
      setMessage("Jadwal dihapus. Karyawan kembali ke shift default untuk hari itu.");
      await queryClient.invalidateQueries({ queryKey: ["attendance-schedules"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus jadwal");
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Tab 2: default shift locations ----
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [shiftLocationIds, setShiftLocationIds] = useState<string[]>([]);
  const [savingShiftLocations, setSavingShiftLocations] = useState(false);

  const { data: shiftLocationsData, isPending: shiftLocationsPending, error: shiftLocationsError } = useQuery({
    queryKey: ["attendance-shift-locations", selectedShiftId],
    queryFn: () => fetchApiData<{ workLocationIds: string[] }>(
      `/api/attendance/shift-locations/${selectedShiftId}`,
      "Gagal memuat lokasi shift",
    ),
    enabled: tab === "shift-locations" && Boolean(selectedShiftId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const loadingShiftLocations = shiftLocationsPending;

  useEffect(() => {
    if (!selectedShiftId) {
      setShiftLocationIds([]);
      return;
    }
    if (shiftLocationsData) {
      setShiftLocationIds(shiftLocationsData.workLocationIds || EMPTY_WORK_LOCATION_IDS);
    }
  }, [selectedShiftId, shiftLocationsData]);

  useEffect(() => {
    const queryError = masterError?.message || schedulesError?.message || shiftLocationsError?.message || "";
    if (queryError) setError(queryError);
  }, [masterError, schedulesError, shiftLocationsError]);

  function toggleShiftLocation(id: string) {
    setShiftLocationIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  async function saveShiftLocations() {
    if (!selectedShiftId) return;
    setSavingShiftLocations(true);
    setError("");
    setMessage("");
    try {
      await api(`/api/attendance/shift-locations/${selectedShiftId}`, {
        method: "PUT",
        body: JSON.stringify({ workLocationIds: shiftLocationIds }),
      });
      setMessage("Lokasi default shift tersimpan.");
      await queryClient.invalidateQueries({ queryKey: ["attendance-shift-locations"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan lokasi shift");
    } finally {
      setSavingShiftLocations(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">🗓️ Jadwal Absensi</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Atur shift harian per karyawan dengan beberapa lokasi kerja yang valid, dan kelola lokasi default shift.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm w-full sm:w-auto" onClick={loadMaster}>
          ↻ Muat ulang data
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`btn btn-sm ${tab === "schedules" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("schedules")}
        >
          Jadwal Harian
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === "shift-locations" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("shift-locations")}
        >
          Lokasi Default Shift
        </button>
      </div>

      {message && (
        <output className="card border border-green-200 bg-green-50 p-4 text-sm text-[var(--success)]">
          {message}
        </output>
      )}
      {error && (
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </div>
      )}

      {loadingMaster ? (
        <output className="card p-8 text-center text-sm text-[var(--text-secondary)]">
          Memuat data...
        </output>
      ) : tab === "schedules" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
          {/* Assignment form */}
          <form onSubmit={submitSchedule} className="card h-fit space-y-4 p-5">
            <h2 className="text-base font-bold">➕ Tetapkan Jadwal</h2>
            <div>
              <label className="label" htmlFor="sched-employee">Karyawan</label>
              <select
                id="sched-employee"
                className="input"
                required
                value={form.employeeId}
                onChange={(e) => setForm((c) => ({ ...c, employeeId: e.target.value }))}
              >
                <option value="">Pilih karyawan</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                    {emp.nip ? ` (${emp.nip})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sched-date">Tanggal</label>
              <input
                id="sched-date"
                type="date"
                className="input"
                required
                value={form.date}
                onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="sched-shift">Shift</label>
              <select
                id="sched-shift"
                className="input"
                required
                value={form.shiftId}
                onChange={(e) => setForm((c) => ({ ...c, shiftId: e.target.value }))}
              >
                <option value="">Pilih shift</option>
                {activeShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime}–{shift.endTime})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Lokasi kerja valid (pilih ≥ 1)</span>
              {activeLocations.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Belum ada lokasi kerja aktif.</p>
              ) : (
                <div className="max-h-56 space-y-1 overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
                  {activeLocations.map((loc) => (
                    <label key={loc.id} className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-[var(--bg-input)]">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={form.workLocationIds.includes(loc.id)}
                        onChange={() => toggleFormLocation(loc.id)}
                      />
                      <span className="text-sm">
                        <span className="font-medium">{loc.name}</span>
                        <span className="block text-xs text-[var(--text-muted)]">{loc.address}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={savingSchedule}>
              {savingSchedule ? "Menyimpan..." : "💾 Simpan Jadwal"}
            </button>
          </form>

          {/* Schedule list */}
          <div className="space-y-4">
            <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="label" htmlFor="range-from">Dari</label>
                <input id="range-from" type="date" className="input" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="range-to">Sampai</label>
                <input id="range-to" type="date" className="input" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="range-emp">Karyawan</label>
                <select id="range-emp" className="input" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                  <option value="">Semua</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-secondary" onClick={loadSchedules} disabled={loadingSchedules}>
                {loadingSchedules ? "Memuat..." : "🔍 Tampilkan"}
              </button>
            </div>

            {loadingSchedules ? (
              <output className="card p-8 text-center text-sm text-[var(--text-secondary)]">Memuat jadwal...</output>
            ) : schedules.length === 0 ? (
              <output className="card p-8 text-center text-sm text-[var(--text-secondary)]">
                Tidak ada jadwal pada rentang ini.
              </output>
            ) : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-muted)]">
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Karyawan</th>
                      <th className="p-3">Shift</th>
                      <th className="p-3">Lokasi valid</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="p-3 font-mono">{row.date}</td>
                        <td className="p-3">{employeeNameById.get(row.employeeId) || row.employeeId}</td>
                        <td className="p-3">{row.shiftName || row.shiftId}</td>
                        <td className="p-3">
                          {row.workLocationIds.length === 0 ? (
                            <span className="text-[var(--text-muted)]">— (pakai lokasi default shift)</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {row.workLocationIds.map((id) => (
                                <span key={id} className="badge badge-success">
                                  {locationNameById.get(id) || id}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-[var(--danger)]"
                            disabled={deletingId === row.id}
                            onClick={() => deleteSchedule(row)}
                          >
                            {deletingId === row.id ? "Menghapus..." : "🗑️ Hapus"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ---- Tab 2 ----
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="card h-fit space-y-4 p-5">
            <h2 className="text-base font-bold">🏢 Lokasi Default per Shift</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Lokasi ini berlaku untuk karyawan yang memakai shift default tanpa jadwal harian khusus.
            </p>
            <div>
              <label className="label" htmlFor="sl-shift">Shift</label>
              <select
                id="sl-shift"
                className="input"
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
              >
                <option value="">Pilih shift</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime}–{shift.endTime}){shift.isActive ? "" : " — nonaktif"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card space-y-4 p-5">
            {!selectedShiftId ? (
              <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                Pilih shift untuk mengatur lokasi default.
              </div>
            ) : loadingShiftLocations ? (
              <output className="p-6 text-center text-sm text-[var(--text-secondary)]">Memuat lokasi...</output>
            ) : activeLocations.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-muted)]">Belum ada lokasi kerja aktif.</div>
            ) : (
              <>
                <div className="space-y-1">
                  {activeLocations.map((loc) => (
                    <label key={loc.id} className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-[var(--bg-input)]">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={shiftLocationIds.includes(loc.id)}
                        onChange={() => toggleShiftLocation(loc.id)}
                      />
                      <span className="text-sm">
                        <span className="font-medium">{loc.name}</span>
                        <span className="block text-xs text-[var(--text-muted)]">{loc.address}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button type="button" className="btn btn-primary" onClick={saveShiftLocations} disabled={savingShiftLocations}>
                    {savingShiftLocations ? "Menyimpan..." : "💾 Simpan Lokasi Default"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
