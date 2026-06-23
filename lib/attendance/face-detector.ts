/**
 * Lazy MediaPipe FaceDetector wrapper for the realtime selfie camera.
 *
 * The runtime loader is browser-only and loads WASM + model from a CDN on
 * demand (never bundled, never blocks first paint). The box-selection logic is
 * kept pure and exported so it can be unit-tested without a camera or the
 * MediaPipe runtime. Callers MUST treat a load failure as "unsupported" and
 * fall back — liveness is advisory and must never block check-in.
 */
import type { FaceBox } from './face-metrics';

/** Minimal shape of a MediaPipe detection bounding box (video pixels). */
export interface DetectionBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface Detection {
  boundingBox?: DetectionBoundingBox;
}

/**
 * Pure: pick the largest detected face and map it to a FaceBox. Returns null
 * when there are no usable detections. Unit-testable without MediaPipe.
 */
export function pickLargestFaceBox(detections: readonly Detection[] | undefined | null): FaceBox | null {
  if (!detections || detections.length === 0) return null;

  let best: FaceBox | null = null;
  let bestArea = 0;
  for (const detection of detections) {
    const box = detection.boundingBox;
    if (!box || box.width <= 0 || box.height <= 0) continue;
    const area = box.width * box.height;
    if (area > bestArea) {
      bestArea = area;
      best = { x: box.originX, y: box.originY, width: box.width, height: box.height };
    }
  }
  return best;
}

// ---- Browser-only runtime wrapper (not unit-tested) --------------------------

const MEDIAPIPE_VERSION = '0.10.35';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

export interface RealtimeFaceDetector {
  detect(video: HTMLVideoElement, timestampMs: number): FaceBox | null;
  close(): void;
}

let detectorPromise: Promise<RealtimeFaceDetector> | null = null;

/**
 * Lazily load the MediaPipe FaceDetector (cached across calls). Rejects when the
 * runtime or model cannot be loaded; the caller falls back to "unsupported".
 */
export function loadFaceDetector(): Promise<RealtimeFaceDetector> {
  if (detectorPromise) return detectorPromise;

  detectorPromise = (async (): Promise<RealtimeFaceDetector> => {
    const vision = await import('@mediapipe/tasks-vision');
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
    const faceDetector = await vision.FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    });

    return {
      detect(video: HTMLVideoElement, timestampMs: number): FaceBox | null {
        const result = faceDetector.detectForVideo(video, timestampMs);
        return pickLargestFaceBox(result?.detections as Detection[] | undefined);
      },
      close(): void {
        try {
          faceDetector.close();
        } catch {
          /* ignore close errors */
        }
      },
    };
  })().catch((error: unknown) => {
    detectorPromise = null; // allow a later retry
    throw error;
  });

  return detectorPromise;
}
