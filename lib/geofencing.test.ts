import { describe, expect, it } from 'vitest';
import { calculateDistance, isGpsAccuracyAcceptable, isWithinGeofence } from './geofencing';

describe('geofencing utilities', () => {
  it('calculates zero distance for same coordinate', () => {
    expect(calculateDistance(3.5952, 98.6722, 3.5952, 98.6722)).toBe(0);
  });

  it('accepts coordinates inside or at radius boundary', () => {
    const locationLat = 3.5952;
    const locationLon = 98.6722;
    const nearbyLat = 3.59565;

    expect(isWithinGeofence(nearbyLat, locationLon, locationLat, locationLon, 60)).toBe(true);
  });

  it('rejects coordinates outside radius', () => {
    expect(isWithinGeofence(3.597, 98.6722, 3.5952, 98.6722, 100)).toBe(false);
  });

  it('requires GPS accuracy within 50 meters', () => {
    expect(isGpsAccuracyAcceptable(50)).toBe(true);
    expect(isGpsAccuracyAcceptable(51)).toBe(false);
  });
});
