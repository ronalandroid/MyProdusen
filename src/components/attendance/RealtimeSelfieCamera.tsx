"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, XCircle } from "lucide-react";

type RealtimeSelfieCameraProps = {
  capturedPreviewUrl: string;
  disabled?: boolean;
  onCapture: (selfie: { blob: Blob; previewUrl: string }) => void;
  onClear: () => void;
};

const CAMERA_NOT_SUPPORTED = "Browser tidak mendukung akses kamera realtime.";
const CAMERA_PERMISSION_ERROR = "Kamera tidak dapat diakses. Izinkan akses kamera untuk absensi.";
const CAMERA_NOT_FOUND = "Perangkat tidak memiliki kamera yang tersedia.";
const CAPTURE_FAILED = "Gagal mengambil selfie. Silakan coba lagi.";

export function RealtimeSelfieCamera({ capturedPreviewUrl, disabled, onCapture, onClear }: RealtimeSelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");

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
          width: { ideal: 720 },
          height: { ideal: 720 },
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

  function captureSelfie() {
    setCameraError("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(CAPTURE_FAILED);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError(CAPTURE_FAILED);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(CAPTURE_FAILED);
          return;
        }

        stopCamera();
        onCapture({ blob, previewUrl: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.86,
    );
  }

  function retakeSelfie() {
    onClear();
    void openCamera();
  }

  useEffect(() => stopCamera, []);

  return (
    <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Selfie Realtime Kehadiran</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Selfie realtime wajib diambil untuk melanjutkan absensi.
        </p>
      </div>

      {cameraError && (
        <div role="alert" style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 600 }}>
          {cameraError}
        </div>
      )}

      <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {capturedPreviewUrl ? (
          <img src={capturedPreviewUrl} alt="Preview selfie realtime" style={{ width: "100%", maxHeight: "320px", objectFit: "cover" }} />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: isCameraOpen ? "block" : "none" }}
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

      <div className="flex flex-col gap-2 sm:flex-row">
        {!capturedPreviewUrl && !isCameraOpen && (
          <button type="button" className="btn btn-primary" onClick={openCamera} disabled={disabled || isStarting} style={{ flex: 1 }}>
            {isStarting ? "Membuka kamera..." : "Buka Kamera"}
          </button>
        )}
        {!capturedPreviewUrl && isCameraOpen && (
          <>
            <button type="button" className="btn btn-primary" onClick={captureSelfie} disabled={disabled} style={{ flex: 1 }}>
              Ambil Selfie
            </button>
            <button type="button" className="btn btn-secondary" onClick={stopCamera} disabled={disabled} style={{ flex: 1 }}>
              <XCircle size={16} /> Tutup Kamera
            </button>
          </>
        )}
        {capturedPreviewUrl && (
          <button type="button" className="btn btn-secondary" onClick={retakeSelfie} disabled={disabled} style={{ flex: 1 }}>
            <RefreshCcw size={16} /> Ambil Ulang Selfie
          </button>
        )}
      </div>
    </div>
  );
}
