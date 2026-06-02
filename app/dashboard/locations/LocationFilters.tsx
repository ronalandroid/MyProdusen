import { Search } from "lucide-react";
import type { ActiveFilter } from "./state";

interface LocationFiltersProps {
  searchTerm: string;
  activeFilter: ActiveFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: ActiveFilter) => void;
}

export function LocationFilters({ searchTerm, activeFilter, onSearchChange, onFilterChange }: LocationFiltersProps) {
  return (
    <div className="card" style={{ padding: "16px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
      <div style={{ position: "relative", flex: "1 1 240px" }}>
        <Search size={16} aria-hidden="true" style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <label className="sr-only" htmlFor="location-search">Cari lokasi</label>
        <input
          id="location-search"
          type="search"
          className="input"
          placeholder="Cari nama atau alamat lokasi…"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          style={{ paddingLeft: "36px" }}
        />
      </div>
      <label className="sr-only" htmlFor="location-status-filter">Filter status</label>
      <select
        id="location-status-filter"
        className="input"
        style={{ maxWidth: "200px" }}
        value={activeFilter}
        onChange={(event) => onFilterChange(event.target.value as ActiveFilter)}
      >
        <option value="all">Semua status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </select>
    </div>
  );
}
