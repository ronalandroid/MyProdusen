"use client";

import { useCallback, useReducer } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import { LocationCard } from "./LocationCard";
import { LocationFilters } from "./LocationFilters";
import { LocationFormModal } from "./LocationFormModal";
import { DeleteLocationDialog } from "./DeleteLocationDialog";
import {
  INITIAL_STATE,
  locationsReducer,
  type WorkLocationItem,
} from "./state";

// LocationCard renders Maps link: https://www.google.com/maps/search/?api=1&query= and label Open in Google Maps.
export default function LocationsPage() {
  const [state, dispatch] = useReducer(locationsReducer, INITIAL_STATE);
  const {
    message,
    searchTerm,
    activeFilter,
    showModal,
    editing,
    pendingDelete,
    form,
    submitting,
    deleting,
  } = state;
  const queryClient = useQueryClient();
  const locationsQuery = useQuery<WorkLocationItem[]>({
    queryKey: ["work-locations", activeFilter, searchTerm.trim()],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("isActive", activeFilter === "active" ? "true" : "false");
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) params.set("search", trimmed);
      return fetchApiData<WorkLocationItem[]>(`/api/work-locations?${params.toString()}`, "Gagal memuat lokasi kerja");
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  const locations = locationsQuery.data ?? [];
  const isLoading = locationsQuery.isLoading;
  const error = state.error || locationsQuery.error?.message || "";
  const reloadLocations = useCallback(() => queryClient.invalidateQueries({ queryKey: ["work-locations"] }), [queryClient]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const lat = Number(form.latitude);
      const lng = Number(form.longitude);
      const radius = Number(form.radius);

      if (form.name.trim().length < 3) {
        dispatch({ type: "validationError", error: "Nama lokasi minimal 3 karakter." });
        return;
      }
      if (form.address.trim().length < 5) {
        dispatch({ type: "validationError", error: "Alamat minimal 5 karakter." });
        return;
      }
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        dispatch({ type: "validationError", error: "Latitude harus antara -90 dan 90." });
        return;
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        dispatch({ type: "validationError", error: "Longitude harus antara -180 dan 180." });
        return;
      }
      if (!Number.isFinite(radius) || radius < 10 || radius > 1000) {
        dispatch({ type: "validationError", error: "Radius harus antara 10 dan 1000 meter." });
        return;
      }

      dispatch({ type: "submitStart" });
      try {
        const url = editing ? `/api/work-locations/${editing.id}` : `/api/work-locations`;
        const method = editing ? "PUT" : "POST";
        const body = editing
          ? {
              name: form.name.trim(),
              address: form.address.trim(),
              latitude: lat,
              longitude: lng,
              radius,
              isActive: form.isActive,
            }
          : {
              name: form.name.trim(),
              address: form.address.trim(),
              latitude: lat,
              longitude: lng,
              radius,
            };

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(body),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Gagal menyimpan lokasi kerja.");
        }
        dispatch({
          type: "submitSuccess",
          message: editing ? "Lokasi kerja berhasil diperbarui." : "Lokasi kerja berhasil ditambahkan.",
        });
        await reloadLocations();
      } catch (err) {
        dispatch({ type: "submitError", error: err instanceof Error ? err.message : "Gagal menyimpan lokasi kerja." });
      }
    },
    [editing, form, reloadLocations],
  );

  const remove = useCallback(
    async (location: WorkLocationItem) => {
      dispatch({ type: "deleteStart" });
      try {
        const response = await fetch(`/api/work-locations/${location.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Gagal menghapus lokasi.");
        }
        dispatch({ type: "deleteSuccess", message: "Lokasi kerja berhasil dihapus." });
        await reloadLocations();
      } catch (err) {
        dispatch({ type: "deleteError", error: err instanceof Error ? err.message : "Gagal menghapus lokasi." });
      }
    },
    [reloadLocations],
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ width: 44, height: 44, background: "var(--primary-light)", color: "var(--primary-dark)" }}
          >
            <MapPin size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 style={{ fontSize: "22px", fontWeight: 600 }} className="truncate">Lokasi Kerja</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>Kelola lokasi kerja dan radius geo-fencing.</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "openCreate" })}>
          <Plus size={16} aria-hidden="true" /> Tambah Lokasi
        </button>
      </div>

      {error && (
        <div role="alert" className="card" style={{ padding: "12px 16px", borderColor: "var(--danger)", color: "var(--danger)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="card" style={{ padding: "12px 16px", borderColor: "var(--success)", color: "var(--success)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
          {message}
        </div>
      )}

      <LocationFilters
        searchTerm={searchTerm}
        activeFilter={activeFilter}
        onSearchChange={(value) => dispatch({ type: "setSearchTerm", value })}
        onFilterChange={(value) => dispatch({ type: "setActiveFilter", value })}
      />

      {isLoading ? (
        <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>Memuat lokasi kerja…</div>
      ) : locations.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "32px 16px", textAlign: "center" }}>
          <p className="text-sm font-semibold">Belum ada lokasi kerja</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Tambahkan lokasi kerja untuk mengaktifkan absensi dengan geo-fence.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={(location) => dispatch({ type: "openEdit", location })}
              onRequestDelete={(location) => dispatch({ type: "requestDelete", location })}
            />
          ))}
        </div>
      )}

      {showModal && (
        <LocationFormModal
          editing={editing}
          form={form}
          submitting={submitting}
          onClose={() => dispatch({ type: "closeModal" })}
          onPatch={(patch) => dispatch({ type: "patchForm", patch })}
          onSubmit={submit}
        />
      )}

      {pendingDelete && (
        <DeleteLocationDialog
          location={pendingDelete}
          deleting={deleting}
          onCancel={() => {
            if (!deleting) dispatch({ type: "cancelDelete" });
          }}
          onConfirm={() => void remove(pendingDelete)}
        />
      )}
    </div>
  );
}
