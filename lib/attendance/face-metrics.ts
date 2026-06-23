/**
 * Pure face-position evaluation for the live selfie camera guide.
 *
 * Given a detected face bounding box (pixels, from MediaPipe) and the video
 * frame size, decides the real-time guidance shown to the user (too far / too
 * close / off-center / good) and a presence/quality score. Kept pure and
 * DOM-free so it is fully unit-testable without a camera; the MediaPipe wrapper
 * calls this on each frame.
 */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameSize {
  width: number;
  height: number;
}

export type FacePositionStatus = 'no-face' | 'too-far' | 'too-close' | 'off-center' | 'good';

export interface FaceMetrics {
  status: FacePositionStatus;
  feedback: string;
  centered: boolean;
  fillRatio: number;
  score: number;
}

/** Face height must be at least this fraction of the frame height. */
export const FACE_MIN_FILL = 0.3;
/** ...and at most this fraction (otherwise too close). */
export const FACE_MAX_FILL = 0.8;
/** Face centre must be within this fraction of the frame centre on each axis. */
export const FACE_CENTER_TOLERANCE = 0.18;

export function evaluateFacePosition(face: FaceBox | null, frame: FrameSize): FaceMetrics {
  if (!face || frame.width <= 0 || frame.height <= 0) {
    return {
      status: 'no-face',
      feedback: 'Posisikan wajah di dalam bingkai',
      centered: false,
      fillRatio: 0,
      score: 0,
    };
  }

  const fillRatio = face.height / frame.height;
  const centerX = (face.x + face.width / 2) / frame.width;
  const centerY = (face.y + face.height / 2) / frame.height;
  const offCenter =
    Math.abs(centerX - 0.5) > FACE_CENTER_TOLERANCE || Math.abs(centerY - 0.5) > FACE_CENTER_TOLERANCE;

  if (fillRatio < FACE_MIN_FILL) {
    return { status: 'too-far', feedback: 'Dekatkan wajah ke kamera', centered: !offCenter, fillRatio, score: 0.3 };
  }
  if (fillRatio > FACE_MAX_FILL) {
    return { status: 'too-close', feedback: 'Jauhkan sedikit wajah Anda', centered: !offCenter, fillRatio, score: 0.4 };
  }
  if (offCenter) {
    return { status: 'off-center', feedback: 'Posisikan wajah di tengah bingkai', centered: false, fillRatio, score: 0.5 };
  }
  return { status: 'good', feedback: 'Tahan posisi, sedang memverifikasi…', centered: true, fillRatio, score: 0.85 };
}
