import { describe, it, expect } from 'vitest';
import { resolveWorkLocation } from '@/components/dashboard/employee/helpers';
import type { ClientUserProfile } from '@/lib/auth-client';

/**
 * Regression: the beranda used to fetch GET /api/work-locations/[id] to render the
 * employee's work location. That endpoint is gated behind LOCATION_READ (SUPERADMIN
 * only), so it returned 403 for every EMPLOYEE/LEADER — the beranda always showed
 * "Lokasi belum ditentukan" and never rendered the distance-to-radius readout, even
 * when a location was assigned. The profile already carries the resolved location,
 * so it must be read from there instead.
 */
function buildProfile(defaultLocation: unknown): ClientUserProfile {
  return {
    employee: { defaultLocation },
  } as unknown as ClientUserProfile;
}

describe('resolveWorkLocation', () => {
  it('returns the location assigned to the employee in their own profile', () => {
    // Arrange
    const profile = buildProfile({
      id: 'loc_1',
      name: 'Produsen Dimsum Medan | TBM GRUP',
      address: 'Jl. Gurilla No.44, Medan Perjuangan',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 200,
    });

    // Act
    const location = resolveWorkLocation(profile);

    // Assert
    expect(location).toEqual({
      id: 'loc_1',
      name: 'Produsen Dimsum Medan | TBM GRUP',
      address: 'Jl. Gurilla No.44, Medan Perjuangan',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 200,
    });
  });

  it('exposes latitude, longitude and radius so the geofence readout can be computed', () => {
    const location = resolveWorkLocation(
      buildProfile({ id: 'loc_1', name: 'Pabrik', address: 'Jl. A', latitude: 1.5, longitude: 2.5, radius: 150 }),
    );

    expect(location?.latitude).toBe(1.5);
    expect(location?.longitude).toBe(2.5);
    expect(location?.radius).toBe(150);
  });

  it('returns null when the employee has no location assigned', () => {
    expect(resolveWorkLocation(buildProfile(null))).toBeNull();
  });

  it('returns null when there is no profile or no employee record', () => {
    expect(resolveWorkLocation(null)).toBeNull();
    expect(resolveWorkLocation({ employee: null } as unknown as ClientUserProfile)).toBeNull();
  });
});
