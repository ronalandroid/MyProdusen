import { describe, it, expect } from 'vitest';
import { pickLargestFaceBox } from './face-detector';

describe('pickLargestFaceBox', () => {
  it('returns null for null/undefined/empty detections', () => {
    expect(pickLargestFaceBox(null)).toBeNull();
    expect(pickLargestFaceBox(undefined)).toBeNull();
    expect(pickLargestFaceBox([])).toBeNull();
  });

  it('returns null when a detection has no bounding box', () => {
    expect(pickLargestFaceBox([{}])).toBeNull();
  });

  it('skips zero/negative-area boxes', () => {
    expect(pickLargestFaceBox([{ boundingBox: { originX: 0, originY: 0, width: 0, height: 10 } }])).toBeNull();
    expect(pickLargestFaceBox([{ boundingBox: { originX: 0, originY: 0, width: 10, height: 0 } }])).toBeNull();
  });

  it('maps a single detection to a FaceBox', () => {
    const box = pickLargestFaceBox([{ boundingBox: { originX: 4, originY: 8, width: 20, height: 24 } }]);
    expect(box).toEqual({ x: 4, y: 8, width: 20, height: 24 });
  });

  it('picks the largest face by area among several', () => {
    const box = pickLargestFaceBox([
      { boundingBox: { originX: 1, originY: 1, width: 10, height: 10 } },
      { boundingBox: { originX: 5, originY: 6, width: 40, height: 40 } },
      { boundingBox: { originX: 2, originY: 2, width: 20, height: 20 } },
    ]);
    expect(box).toEqual({ x: 5, y: 6, width: 40, height: 40 });
  });
});
