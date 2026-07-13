import { eq } from 'drizzle-orm';
import { db, companySettings } from '@/lib/db';

const REGISTRATION_OPEN_KEY = 'PUBLIC_REGISTRATION_OPEN';

/** Default is OPEN: the row only exists once a Superadmin has touched the toggle. */
export async function isPublicRegistrationOpen(): Promise<boolean> {
  const [row] = await db
    .select({ value: companySettings.value })
    .from(companySettings)
    .where(eq(companySettings.key, REGISTRATION_OPEN_KEY))
    .limit(1);
  return row ? row.value !== 'false' : true;
}

export async function setPublicRegistrationOpen(open: boolean, actorUserId: string): Promise<boolean> {
  await db
    .insert(companySettings)
    .values({
      id: `setting_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      key: REGISTRATION_OPEN_KEY,
      value: String(open),
      description: 'Buka/tutup pendaftaran akun publik dari halaman /register',
      updatedBy: actorUserId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: companySettings.key,
      set: { value: String(open), updatedBy: actorUserId, updatedAt: new Date() },
    });
  return open;
}
