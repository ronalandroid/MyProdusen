import { afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { workLocationRepository } from '../../src/server/repositories/work-locations.repository';
import { db, workLocations } from '@/lib/db';

const createdIds: string[] = [];

afterAll(async () => {
  for (const id of createdIds) {
    await db.delete(workLocations).where(eq(workLocations.id, id));
  }
});

async function seedLocation(name: string, address: string) {
  const id = `loc_search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  createdIds.push(id);
  await db.insert(workLocations).values({
    id,
    name,
    address,
    latitude: 3.5952,
    longitude: 98.6722,
    radius: 100,
    isActive: true,
  });
  return id;
}

describe('Work location search', () => {
  it('matches name case-insensitively', async () => {
    const tag = `Cafe-${Math.random().toString(36).slice(2, 6)}`;
    const id = await seedLocation(`${tag} Cabang Utama`, 'Jl. Kebon Jeruk');

    const lower = await workLocationRepository.list({ search: tag.toLowerCase() });
    const upper = await workLocationRepository.list({ search: tag.toUpperCase() });

    expect(lower.some((row) => row.id === id)).toBe(true);
    expect(upper.some((row) => row.id === id)).toBe(true);
  });

  it('matches address fragment', async () => {
    const tag = `Jl-${Math.random().toString(36).slice(2, 6)}-Tomang`;
    const id = await seedLocation('Pabrik Cabang', tag);

    const result = await workLocationRepository.list({ search: 'tomang' });
    expect(result.some((row) => row.id === id)).toBe(true);
  });

  it('returns empty when search has no match', async () => {
    const result = await workLocationRepository.list({ search: 'no-such-location-xyz-zzz-001' });
    expect(result.length).toBe(0);
  });
});
