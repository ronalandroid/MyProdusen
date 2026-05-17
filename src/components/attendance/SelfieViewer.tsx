"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getAuthHeaders } from "@/lib/auth-client";

type SelfieKind = "check-in" | "check-out";

interface SelfieViewerProps {
  attendanceId: string;
  kind: SelfieKind;
  open: boolean;
  onClose: () => void;
  /** Optional metadata for the modal header */
  takenAt?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
}

const KIND_LABEL: Record<SelfieKind, string> = {
  "check-in": "Selfie Masuk",
  "check-out": "Selfie Pulang",
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SelfieViewer({
  attendanceId,
  kind,
  open,
  onClose,
  takenAt,
  sizeBytes,
  mimeType,
}: SelfieViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;
    let createdUrl: string | null = null;

    async function loadSelfie() {
      setIsLoading(true);
      setError(null);
      setImageUrl(null);

      try {
        const response = await fetch(`/api/attendances/${attendanceId}/selfie/${kind}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        if (!response.ok) {
          let message = "Selfie tidak dapat dimuat";
          try {
            const data = await response.json();
            if (data?.error) message = data.error;
          } catch {
            /* not JSON */
          }
          if (response.status === 403) {
            message = "Anda tidak memiliki akses melihat selfie ini.";
          }
          if (response.status === 404) {
            message = "Selfie tidak ditemukan.";
          }
          throw new Error(message);
        }

        const blob = await response.blob();
        if (isCancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setImageUrl(createdUrl);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Selfie tidak dapat dimuat");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void loadSelfie();

    return () => {
      isCancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, attendanceId, kind]);

  const formattedSize = formatBytes(sizeBytes);
  const formattedTakenAt = takenAt
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(takenAt))
    : null;

  return (
    <Modal isOpen={open} onClose={onClose} title={KIND_LABEL[kind]} size="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            minHeight: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {isLoading && (
            <div role="status" aria-live="polite" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Memuat selfie...
            </div>
          )}
          {!isLoading && error && (
            <div
              role="alert"
              style={{
                padding: "20px",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--danger)",
                fontWeight: 600,
              }}
            >
              <Camera size={24} className="mx-auto mb-2" aria-hidden="true" />
              {error}
            </div>
          )}
          {!isLoading && !error && imageUrl && (
            <img
              src={imageUrl}
              alt={`${KIND_LABEL[kind]} absensi ${attendanceId}`}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", maxHeight: "60vh", objectFit: "contain" }}
            />
          )}
        </div>

        {(formattedTakenAt || formattedSize || mimeType) && (
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "8px 16px",
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            {formattedTakenAt && (
              <div>
                <dt style={{ fontWeight: 600 }}>Diambil</dt>
                <dd>{formattedTakenAt}</dd>
              </div>
            )}
            {formattedSize && (
              <div>
                <dt style={{ fontWeight: 600 }}>Ukuran file</dt>
                <dd>{formattedSize}</dd>
              </div>
            )}
            {mimeType && (
              <div>
                <dt style={{ fontWeight: 600 }}>Format</dt>
                <dd>{mimeType.replace("image/", "").toUpperCase()}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </Modal>
  );
}
