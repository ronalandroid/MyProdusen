import type { WorkLocationItem } from "./state";

interface DeleteLocationDialogProps {
  location: WorkLocationItem;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteLocationDialog({ location, deleting, onCancel, onConfirm }: DeleteLocationDialogProps) {
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-location-title">
        <h2 id="delete-location-title" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Hapus lokasi kerja?</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
          Lokasi &quot;{location.name}&quot; akan dinonaktifkan dari daftar operasional. Riwayat absensi lama tetap tersimpan.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={deleting}>Batal</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
