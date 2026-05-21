import { describe, expect, it, vi, afterEach } from 'vitest';
import { calculateDistance, isGpsAccuracyAcceptable, isWithinGeofence, getMaxGpsAccuracyMeters } from './geofencing';

describe('geofencing utilities', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it('uses default 100m threshold when env not set', () => {
    vi.stubEnv('GPS_MAX_ACCURACY_METERS', '');
    expect(getMaxGpsAccuracyMeters()).toBe(100);
    expect(isGpsAccuracyAcceptable(100)).toBe(true);
    expect(isGpsAccuracyAcceptable(101)).toBe(false);
  });

  it('reads GPS_MAX_ACCURACY_METERS from env', () => {
    vi.stubEnv('GPS_MAX_ACCURACY_METERS', '50');
    expect(getMaxGpsAccuracyMeters()).toBe(50);
    expect(isGpsAccuracyAcceptable(50)).toBe(true);
    expect(isGpsAccuracyAcceptable(51)).toBe(false);
  });

  it('accepts explicit maxMeters override', () => {
    expect(isGpsAccuracyAcceptable(75, 80)).toBe(true);
    expect(isGpsAccuracyAcceptable(85, 80)).toBe(false);
  });
});
