import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const username = process.env.SUPERADMIN_USERNAME;

  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (!email || !password || !username) {
    console.log('Superadmin bootstrap skipped; required env is incomplete');
    return;
  }
  if (password.length < 12) throw new Error('SUPERADMIN_PASSWORD must be at least 12 characters');

  const url = new URL(databaseUrl);
  url.searchParams.delete('schema');

  const sql = postgres(url.toString(), { max: 1 });
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = `user_superadmin_${Date.now()}`;

  await sql`
    insert into "User" (id, email, username, password, role, "isActive", "createdAt", "updatedAt")
    values (${userId}, ${email}, ${username}, ${passwordHash}, 'SUPERADMIN', true, now(), now())
    on conflict (email) do update set
      username = excluded.username,
      password = excluded.password,
      role = 'SUPERADMIN',
      "isActive" = true,
      "updatedAt" = now()
  `;

  await sql.end();
  console.log('Superadmin ready');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Superadmin bootstrap failed');
  process.exit(1);
});
