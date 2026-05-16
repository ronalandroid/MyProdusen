import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.SUPERADMIN_EMAIL;
const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
const password = process.env.SUPERADMIN_PASSWORD;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

if (!email || !username || !password) {
  console.log('Superadmin bootstrap skipped; required env is incomplete');
  process.exit(0);
}

if (password.length < 12) {
  throw new Error('SUPERADMIN_PASSWORD must be at least 12 characters');
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1 });
const passwordHash = await bcrypt.hash(password, 12);
const userId = `user_superadmin_${Date.now()}`;

await sql.begin(async (tx) => {
  const existing = await tx`
    select id
    from "User"
    where email = ${email} or username = ${username}
    order by case when username = ${username} then 0 else 1 end
    limit 1
  `;

  if (existing.length > 0) {
    await tx`
      update "User"
      set email = ${email},
          username = ${username},
          password = ${passwordHash},
          role = 'SUPERADMIN',
          "isActive" = true,
          "updatedAt" = now()
      where id = ${existing[0].id}
    `;
    return;
  }

  await tx`
    insert into "User" (id, email, username, password, role, "isActive", "createdAt", "updatedAt")
    values (${userId}, ${email}, ${username}, ${passwordHash}, 'SUPERADMIN', true, now(), now())
  `;
});

await sql.end();
console.log('Superadmin bootstrap finished');
