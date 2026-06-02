import { Edit, MapPin, Trash2 } from "lucide-react";
import { WorkLocationMap } from "@/components/locations/WorkLocationMap";
import type { WorkLocationItem } from "./state";

interface LocationCardProps {
  location: WorkLocationItem;
  onEdit: (location: WorkLocationItem) => void;
  onRequestDelete: (location: WorkLocationItem) => void;
}

export function LocationCard({ location, onEdit, onRequestDelete }: LocationCardProps) {
  return (
    <article className="card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--primary)" }} aria-hidden="true" />
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 600 }}>{location.name}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{location.address}</p>
        </div>
        <span className={`badge ${location.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: "12px" }}>
          {location.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <WorkLocationMap
          latitude={location.latitude}
          longitude={location.longitude}
          radiusMeters={location.radius}
          label={location.name}
          height={140}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <div style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>Koordinat</div>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</div>
        </div>
        <div style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>Radius</div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{location.radius} m</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <a
          className="btn btn-secondary btn-sm"
          style={{ flex: "1 1 140px", fontSize: "12px" }}
          href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={14} className="mr-1" /> Buka Maps
        </a>
        <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: "12px" }} onClick={() => onEdit(location)}>
          <Edit size={14} className="mr-1" /> Edit
        </button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }} onClick={() => onRequestDelete(location)} aria-label={`Hapus ${location.name}`}>
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
