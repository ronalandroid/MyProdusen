"use client";

import { useEffect, useRef, useState } from "react";
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
};

const CAMERA_NOT_SUPPORTED = "Browser tidak mendukung akses kamera realtime.";
const CAMERA_PERMISSION_ERROR = "Kamera tidak dapat diakses. Izinkan akses kamera untuk absensi.";
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
}: RealtimeSelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captureInfo, setCaptureInfo] = useState<CompressedSelfie | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }

  async function openCamera() {
    setCameraError("");

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
  }

  async function captureSelfie() {
    setCameraError("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(CAPTURE_FAILED);
      return;
    }

    setIsCapturing(true);
    try {
      const result = await captureSelfieFromVideo(video);

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

  function retakeSelfie() {
    setCaptureInfo(null);
    onClear();
    void openCamera();
  }

  useEffect(() => stopCamera, []);

  return (
    <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Selfie Realtime Kehadiran</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Selfie realtime wajib diambil untuk melanjutkan absensi. Foto akan dikompres otomatis di perangkat agar ringan untuk diunggah.
        </p>
      </div>

      {cameraError && (
        <div role="alert" style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 600 }}>
          {cameraError}
        </div>
      )}

      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          minHeight: "220px",
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
            }}
          />
        )}
        {!capturedPreviewUrl && !isCameraOpen && (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-secondary)", fontSize: "12px" }}>
            <Camera size={40} className="mx-auto mb-2 text-[var(--text-muted)]" />
            Kamera belum aktif.
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {capturedPreviewUrl && captureInfo && (
        <div
          role="status"
          aria-live="polite"
          style={{ fontSize: "12px", color: "var(--text-secondary)" }}
        >
          Selfie {captureInfo.width}×{captureInfo.height}px · {formatKb(captureInfo.size)} · format {captureInfo.mimeType.replace("image/", "").toUpperCase()}
          {captureInfo.exceedsTarget && (
            <span style={{ color: "var(--warning)", marginLeft: "6px", fontWeight: 600 }}>
              · sedikit di atas target 300KB
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!capturedPreviewUrl && !isCameraOpen && (
          <button
            type="button"
            className="btn btn-primary"
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
              className="btn btn-primary"
              onClick={captureSelfie}
              disabled={disabled || isCapturing}
              style={{ flex: 1 }}
            >
              {isCapturing ? "Memproses..." : "Ambil Selfie"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
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
            className="btn btn-secondary"
            onClick={retakeSelfie}
            disabled={disabled}
            style={{ flex: 1 }}
          >
            <RefreshCcw size={16} /> Ambil Ulang Selfie
          </button>
        )}
      </div>
    </div>
  );
}
