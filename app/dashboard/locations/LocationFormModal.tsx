import { MapPin, X } from "lucide-react";
import { WorkLocationMap } from "@/components/locations/WorkLocationMap";
import type { LocationFormState, WorkLocationItem } from "./state";

interface LocationFormModalProps {
  editing: WorkLocationItem | null;
  form: LocationFormState;
  submitting: boolean;
  onClose: () => void;
  onPatch: (patch: Partial<LocationFormState>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function LocationFormModal({
  editing,
  form,
  submitting,
  onClose,
  onPatch,
  onSubmit,
}: LocationFormModalProps) {
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const showPreview =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  return (
    <div className="overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-form-title"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 id="location-form-title" style={{ fontSize: "18px", fontWeight: 600 }}>
            {editing ? "Edit Lokasi Kerja" : "Tambah Lokasi Kerja"}
          </h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label className="label" htmlFor="location-name">Nama Lokasi</label>
            <input
              id="location-name"
              className="input"
              value={form.name}
              onChange={(event) => onPatch({ name: event.target.value })}
              placeholder="Contoh: Pabrik Utama"
              required
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label className="label" htmlFor="location-address">Alamat</label>
            <input
              id="location-address"
              className="input"
              value={form.address}
              onChange={(event) => onPatch({ address: event.target.value })}
              placeholder="Alamat lengkap"
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label className="label" htmlFor="location-latitude">Latitude</label>
              <input
                id="location-latitude"
                className="input"
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(event) => onPatch({ latitude: event.target.value })}
                placeholder="3.5953"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="location-longitude">Longitude</label>
              <input
                id="location-longitude"
                className="input"
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(event) => onPatch({ longitude: event.target.value })}
                placeholder="98.6723"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="location-radius">Radius (m)</label>
              <input
                id="location-radius"
                className="input"
                type="number"
                min={10}
                max={1000}
                value={form.radius}
                onChange={(event) => onPatch({ radius: event.target.value })}
                placeholder="100"
                required
              />
            </div>
          </div>
          {showPreview && (
            <div style={{ marginBottom: "16px" }}>
              <span className="label">Pratinjau peta</span>
              <WorkLocationMap
                latitude={lat}
                longitude={lng}
                radiusMeters={Math.max(10, Math.min(1000, Number(form.radius) || 100))}
                height={180}
              />
              <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                Pratinjau menggunakan ubin OpenStreetMap. Lingkaran kuning menunjukkan radius geo-fence.
              </p>
              <a
                className="btn btn-secondary btn-sm mt-3"
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={14} className="mr-1" /> Open in Google Maps
              </a>
            </div>
          )}
          {editing && (
            <label className="flex items-center gap-2 text-sm" style={{ marginBottom: "16px" }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => onPatch({ isActive: event.target.checked })}
              />
              Lokasi aktif
            </label>
          )}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
