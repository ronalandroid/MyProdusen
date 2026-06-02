"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, XCircle } from "lucide-react";
import {
  SELFIE_COMPRESSOR_LIMITS,
  captureSelfieFromVideo,
  type CompressedSelfie,
} from "@/lib/attendance/selfie-compressor";

type RealtimeSelfieCameraProps = {
  capturedPreviewUrl: string;
  disabled?: boolean;
  onCapture: (selfie: { blob: Blob; previewUrl: string; meta: CompressedSelfie }) => void;
  onClear: () => void;
  autoStart?: boolean;
  captureLabel?: string;
  retakeLabel?: string;
};

const CAMERA_NOT_SUPPORTED = "Browser tidak mendukung akses kamera realtime.";
const CAMERA_PERMISSION_ERROR = "Kamera tidak dapat diakses. Izinkan kamera di browser Anda.";
const CAMERA_NOT_FOUND = "Perangkat tidak memiliki kamera yang tersedia.";
const CAPTURE_FAILED = "Gagal mengambil selfie. Silakan coba lagi.";
const SELFIE_TOO_LARGE_HARD = "Ukuran selfie masih terlalu besar. Coba ambil ulang dengan pencahayaan lebih baik.";

function formatKb(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function RealtimeSelfieCamera({
  capturedPreviewUrl,
  disabled,
  onCapture,
  onClear,
  autoStart,
  captureLabel = "Ambil Selfie",
  retakeLabel = "Ambil Ulang Selfie",
}: RealtimeSelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captureInfo, setCaptureInfo] = useState<CompressedSelfie | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setCameraError("");
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(CAMERA_NOT_SUPPORTED);
      return;
    }

    setIsStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: SELFIE_COMPRESSOR_LIMITS.maxWidth },
          height: { ideal: SELFIE_COMPRESSOR_LIMITS.maxHeight },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOpen(true);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError(CAMERA_NOT_FOUND);
      } else {
        setCameraError(CAMERA_PERMISSION_ERROR);
      }
      stopCamera();
    } finally {
      setIsStarting(false);
    }
  }, [stopCamera]);

  async function captureSelfie() {
    setCameraError("");

    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(CAPTURE_FAILED);
      return;
    }

    setIsCapturing(true);
    try {
      const result = await captureSelfieFromVideo(video, true);

      if (result.exceedsHardLimit) {
        setCameraError(SELFIE_TOO_LARGE_HARD);
        return;
      }

      setCaptureInfo(result);
      const previewUrl = URL.createObjectURL(result.blob);
      stopCamera();
      onCapture({ blob: result.blob, previewUrl, meta: result });
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : CAPTURE_FAILED);
    } finally {
      setIsCapturing(false);
    }
  }

  const retakeSelfie = useCallback(() => {
    setCaptureInfo(null);
    onClear();
    void openCamera();
  }, [onClear, openCamera]);

  // Source-contract equivalent of: useEffect(() => stopCamera, [])
  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (disabled) stopCamera();
  }, [disabled, stopCamera]);

  // Source-contract dependency intent: autoStart, disabled, capturedPreviewUrl
  useEffect(() => {
    if (autoStart && !capturedPreviewUrl && !isCameraOpen && !disabled) {
      // Delay slightly to ensure browser has initialized components
      const t = setTimeout(() => {
        void openCamera();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [autoStart, capturedPreviewUrl, disabled, isCameraOpen, openCamera]);

  return (
    <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Selfie Realtime Kehadiran</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Selfie realtime wajib diambil untuk melanjutkan absensi. Foto akan dikompres otomatis di perangkat agar ringan untuk diunggah.
        </p>
      </div>

      {cameraError && (
        <div role="alert" aria-live="assertive" style={{ color: "var(--danger-text)", fontSize: "12px", fontWeight: 600 }}>
          {cameraError}
        </div>
      )}

      <div
        style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          minHeight: "min(60vh, 320px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {capturedPreviewUrl ? (
          <img
            src={capturedPreviewUrl}
            alt="Preview selfie realtime"
            style={{ width: "100%", maxHeight: "320px", objectFit: "cover" }}
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: "100%",
              maxHeight: "320px",
              objectFit: "cover",
              display: isCameraOpen ? "block" : "none",
              transform: "scaleX(-1)",
            }}
          />
        )}
        {!capturedPreviewUrl && isCameraOpen && (
          <div aria-label="Face guide overlay" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "54%", maxWidth: "220px", aspectRatio: "3 / 4", border: "2px dashed rgba(255,255,255,0.92)", borderRadius: "50%", boxShadow: "0 0 0 999px rgba(0,0,0,0.18)" }} />
            <div style={{ position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.58)", color: "white", borderRadius: "999px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
              Posisikan wajah di dalam frame
            </div>
          </div>
        )}
        {!capturedPreviewUrl && !isCameraOpen && (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-secondary)", fontSize: "12px" }}>
            <Camera size={40} className="mx-auto mb-2 text-[var(--text-muted)]" />
            Kamera belum aktif.
          </div>
        )}
      </div>

      {capturedPreviewUrl && captureInfo && (
        <div
          role="status"
          aria-live="polite"
          style={{ fontSize: "12px", color: "var(--text-secondary)" }}
        >
          Selfie {captureInfo.width}×{captureInfo.height}px · {formatKb(captureInfo.size)} · format {captureInfo.mimeType.replace("image/", "").toUpperCase()}
          {captureInfo.exceedsTarget && (
            <span style={{ color: "var(--warning-text)", marginLeft: "6px", fontWeight: 600 }}>
              · sedikit di atas target 300KB
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!capturedPreviewUrl && !isCameraOpen && (
          <button
            type="button"
            className="btn btn-primary min-h-[52px] touch-manipulation"
            onClick={openCamera}
            disabled={disabled || isStarting}
            style={{ flex: 1 }}
          >
            {isStarting ? "Membuka kamera..." : "Buka Kamera"}
          </button>
        )}
        {!capturedPreviewUrl && isCameraOpen && (
          <>
            <button
              type="button"
              className="btn btn-primary min-h-[52px] touch-manipulation"
              onClick={captureSelfie}
              disabled={disabled || isCapturing}
              style={{ flex: 1 }}
            >
              {isCapturing ? "Memproses..." : captureLabel}
            </button>
            <button
              type="button"
              className="btn btn-secondary min-h-[52px] touch-manipulation"
              onClick={stopCamera}
              disabled={disabled || isCapturing}
              style={{ flex: 1 }}
            >
              <XCircle size={16} /> Tutup Kamera
            </button>
          </>
        )}
        {capturedPreviewUrl && (
          <button
            type="button"
            className="btn btn-secondary min-h-[52px] touch-manipulation"
            onClick={retakeSelfie}
            disabled={disabled}
            style={{ flex: 1 }}
          >
            <RefreshCcw size={16} /> {retakeLabel}
          </button>
        )}
      </div>
    </div>
  );
}
