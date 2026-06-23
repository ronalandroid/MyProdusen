import { describe, it, expect } from 'vitest';
import {
  evaluateFacePosition,
  FACE_MIN_FILL,
  FACE_MAX_FILL,
} from './face-metrics';

const frame = { width: 720, height: 720 };
// Helper: a centered face box of a given fill ratio (height fraction of frame).
const centeredFace = (fill: number) => {
  const h = fill * frame.height;
  const w = h * 0.8;
  return { x: (frame.width - w) / 2, y: (frame.height - h) / 2, width: w, height: h };
};

describe('evaluateFacePosition', () => {
  it('reports no-face for a null detection', () => {
    const m = evaluateFacePosition(null, frame);
    expect(m.status).toBe('no-face');
    expect(m.score).toBe(0);
    expect(m.feedback).toMatch(/bingkai|wajah/i);
  });

  it('reports no-face for a degenerate frame', () => {
    expect(evaluateFacePosition(centeredFace(0.5), { width: 0, height: 0 }).status).toBe('no-face');
  });

  it('asks to come closer when the face is too small', () => {
    const m = evaluateFacePosition(centeredFace(FACE_MIN_FILL - 0.1), frame);
    expect(m.status).toBe('too-far');
    expect(m.feedback).toMatch(/dekat/i);
  });

  it('asks to back off when the face is too large', () => {
    const m = evaluateFacePosition(centeredFace(FACE_MAX_FILL + 0.1), frame);
    expect(m.status).toBe('too-close');
    expect(m.feedback).toMatch(/jauh/i);
  });

  it('asks to center when the face is well-sized but off-center', () => {
    const f = centeredFace(0.5);
    const off = { ...f, x: 0 }; // shoved to the left edge
    const m = evaluateFacePosition(off, frame);
    expect(m.status).toBe('off-center');
    expect(m.centered).toBe(false);
    expect(m.feedback).toMatch(/tengah/i);
  });

  it('reports good for a centered, well-sized face', () => {
    const m = evaluateFacePosition(centeredFace(0.5), frame);
    expect(m.status).toBe('good');
    expect(m.centered).toBe(true);
    expect(m.score).toBeGreaterThan(0.7);
  });

  it('treats the fill thresholds as inclusive boundaries (good)', () => {
    expect(evaluateFacePosition(centeredFace(FACE_MIN_FILL), frame).status).toBe('good');
    expect(evaluateFacePosition(centeredFace(FACE_MAX_FILL), frame).status).toBe('good');
  });
});
