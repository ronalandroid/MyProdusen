"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, XCircle } from "lucide-react";
import {
  SELFIE_COMPRESSOR_LIMITS,
  captureSelfieFromVideo,
  type CompressedSelfie,
} from "@/lib/attendance/selfie-compressor";
import { evaluateFacePosition } from "@/lib/attendance/face-metrics";
import { loadFaceDetector, type RealtimeFaceDetector } from "@/lib/attendance/face-detector";

type LivenessState = "searching" | "detected" | "passed" | "failed" | "unsupported";

type RealtimeSelfieCameraProps = {
  capturedPreviewUrl: string;
  disabled?: boolean;
  onCapture: (selfie: { blob: Blob; previewUrl: string; meta: CompressedSelfie; liveness: { score: number; passed: boolean; unsupported: boolean; faceDetected: boolean } }) => void;
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
const LIVENESS_NOT_READY = "Wajah belum terverifikasi. Posisikan wajah di tengah lalu tahan sebentar.";
const LIVENESS_UNSUPPORTED = "Deteksi wajah tidak didukung di perangkat ini — selfie tetap bisa diambil.";

// Sustained correct positioning before liveness is considered passed, and how
// often we run detection (throttle so old phones stay responsive).
const GOOD_FRAMES_TO_PASS = 8;
const DETECT_INTERVAL_MS = 120;
const PASSED_MIN_SCORE = 0.85;

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
  const [livenessState, setLivenessState] = useState<LivenessState>("searching");
  const [feedback, setFeedback] = useState("");

  // Real liveness signals (refs so the rAF loop doesn't re-trigger renders).
  const livenessScoreRef = useRef(0);
  const detectorRef = useRef<RealtimeFaceDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const goodFramesRef = useRef(0);
  const hasPassedRef = useRef(false);
  const unsupportedRef = useRef(false);
  const faceDetectedRef = useRef(false);
  const lastDetectAtRef = useRef(0);

  const stopDetection = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resetLiveness = useCallback(() => {
    livenessScoreRef.current = 0;
    goodFramesRef.current = 0;
    hasPassedRef.current = false;
    unsupportedRef.current = false;
    faceDetectedRef.current = false;
    lastDetectAtRef.current = 0;
    setLivenessState("searching");
    setFeedback("");
  }, []);

  // Per-frame detection: real face presence + position drives the verdict.
  const runDetectionLoop = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector) return;

    const now = performance.now();
    if (now - lastDetectAtRef.current >= DETECT_INTERVAL_MS && video.readyState >= 2 && video.videoWidth > 0) {
      lastDetectAtRef.current = now;
      try {
        const box = detector.detect(video, now);
        const metrics = evaluateFacePosition(box, { width: video.videoWidth, height: video.videoHeight });
        faceDetectedRef.current = box !== null;
        setFeedback(metrics.feedback);

        if (metrics.status === "good") {
          goodFramesRef.current += 1;
          if (goodFramesRef.current >= GOOD_FRAMES_TO_PASS) hasPassedRef.current = true;
        } else if (!hasPassedRef.current) {
          goodFramesRef.current = 0;
        }

        if (hasPassedRef.current) {
          livenessScoreRef.current = Math.max(metrics.score, PASSED_MIN_SCORE);
          setLivenessState("passed");
        } else {
          livenessScoreRef.current = metrics.score;
          setLivenessState(box ? "detected" : "searching");
        }
      } catch {
        // Transient per-frame detection error — skip this frame, keep going.
      }
    }
    rafRef.current = requestAnimationFrame(runDetectionLoop);
  }, []);

  const startDetectionLoop = useCallback(() => {
    stopDetection();
    rafRef.current = requestAnimationFrame(runDetectionLoop);
  }, [runDetectionLoop, stopDetection]);

  const stopCamera = useCallback(() => {
    stopDetection();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, [stopDetection]);

  const openCamera = useCallback(async () => {
    setCameraError("");
    stopCamera();
    resetLiveness();

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

      // Real liveness via MediaPipe. If it can't load (old device, offline,
      // blocked), fall back to "unsupported" — capture is still allowed and the
      // server flags it for admin review.
      try {
        detectorRef.current = await loadFaceDetector();
        startDetectionLoop();
      } catch {
        unsupportedRef.current = true;
        livenessScoreRef.current = 0;
        setLivenessState("unsupported");
        setFeedback(LIVENESS_UNSUPPORTED);
      }
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
  }, [resetLiveness, startDetectionLoop, stopCamera]);

  async function captureSelfie() {
    setCameraError("");

    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(CAPTURE_FAILED);
      return;
    }

    // Liveness is advisory: unsupported devices may always capture; supported
    // devices must reach a verified (sustained-good) state first.
    const livenessAllowsCapture = unsupportedRef.current || livenessState === "passed";
    if (!livenessAllowsCapture) {
      setLivenessState("failed");
      setCameraError(LIVENESS_NOT_READY);
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
      onCapture({
        blob: result.blob,
        previewUrl,
        meta: result,
        liveness: {
          score: livenessScoreRef.current,
          passed: !unsupportedRef.current && livenessState === "passed",
          unsupported: unsupportedRef.current,
          faceDetected: faceDetectedRef.current,
        },
      });
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : CAPTURE_FAILED);
    } finally {
      setIsCapturing(false);
    }
  }

  const retakeSelfie = useCallback(() => {
    setCaptureInfo(null);
    resetLiveness();
    onClear();
    void openCamera();
  }, [onClear, openCamera, resetLiveness]);

  // Source-contract equivalent of: useEffect(() => stopCamera, [])
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

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

  const statusMessage =
    livenessState === "passed"
      ? "✅ Verifikasi berhasil!"
      : livenessState === "failed"
        ? "❌ Belum terverifikasi. Coba lagi."
        : livenessState === "unsupported"
          ? LIVENESS_UNSUPPORTED
          : feedback || "Posisikan wajah di dalam frame";

  // Brand-aligned guide colours (MyProdusen tokens, auto-adapt to dark mode):
  // verified = attendance green, failed = danger red, face found = brand yellow,
  // still searching = neutral white so it reads on any camera background.
  const guideColor =
    livenessState === "passed"
      ? "var(--attn-success)"
      : livenessState === "failed"
        ? "var(--danger)"
        : livenessState === "detected"
          ? "var(--primary)"
          : "rgba(255,255,255,0.92)";

  const statusPillBg =
    livenessState === "passed"
      ? "var(--attn-success)"
      : livenessState === "failed"
        ? "var(--danger)"
        : "rgba(0,0,0,0.64)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {cameraError && (
        <div role="alert" aria-live="assertive" style={{ color: "var(--danger-text)", fontSize: "12px", fontWeight: 600 }}>
          {cameraError}
        </div>
      )}

      {/* Immersive camera surface with a head + shoulders silhouette guide */}
      <div
        style={{
          position: "relative",
          borderRadius: "20px",
          overflow: "hidden",
          background: "#000",
          width: "100%",
          minHeight: "min(68vh, 540px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {capturedPreviewUrl ? (
          <img
            src={capturedPreviewUrl}
            alt="Preview selfie realtime"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: isCameraOpen ? "block" : "none",
              transform: "scaleX(-1)",
            }}
          />
        )}
        {!capturedPreviewUrl && isCameraOpen && (
          <div aria-label="Panduan posisi kepala dan bahu" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            {/* Soft vignette so the silhouette reads against a bright camera feed */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 64% 72% at 50% 42%, transparent 58%, rgba(0,0,0,0.45) 100%)" }} />
            {/* Head + shoulders silhouette; dashed while searching, solid once detected/verified */}
            <svg viewBox="0 0 200 270" preserveAspectRatio="xMidYMid meet" style={{ position: "relative", width: "70%", maxWidth: "280px", height: "auto" }} aria-hidden="true">
              <ellipse cx="100" cy="80" rx="46" ry="56" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={livenessState === "searching" ? "10 10" : undefined} style={{ stroke: guideColor, transition: "stroke 200ms ease" }} />
              <path d="M26,262 C28,196 58,160 100,160 C142,160 172,196 174,262" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={livenessState === "searching" ? "10 10" : undefined} style={{ stroke: guideColor, transition: "stroke 200ms ease" }} />
            </svg>
            {livenessState === "detected" && <div className="liveness-pulse" aria-hidden="true" />}
            <div role="status" aria-live="assertive" style={{ position: "absolute", bottom: "18px", left: "50%", transform: "translateX(-50%)", background: statusPillBg, color: "white", borderRadius: "999px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap", maxWidth: "90%", textAlign: "center", transition: "background 200ms ease" }}>
              {statusMessage}
            </div>
          </div>
        )}
        {!capturedPreviewUrl && !isCameraOpen && (
          <div style={{ position: "relative", textAlign: "center", padding: "32px 16px", color: "rgba(255,255,255,0.82)", fontSize: "12px" }}>
            <Camera size={40} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.7)" }} />
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
              · sedikit di atas target 200KB
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
