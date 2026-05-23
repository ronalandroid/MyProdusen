import postgres from 'postgres';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

const TEAM_NAMES = ['Cetak', 'Gudang', 'Pengiriman', 'Packing', 'Produksi', 'Quality Control', 'Kargo'];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required');
  process.exit(1);
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

function teamId(name) {
  return `team_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

function teamSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1 });

try {
  await sql.begin(async (tx) => {
    for (const name of TEAM_NAMES) {
      const existing = await tx`
        select id
        from "Team"
        where lower(name) = lower(${name})
        order by case when id = ${teamId(name)} then 0 else 1 end
        limit 1
      `;

      if (existing.length > 0) {
        await tx`
          update "Team"
          set name = ${name},
              slug = coalesce(slug, ${teamSlug(name)}),
              type = coalesce(type, 'production'),
              active = true,
              "updatedAt" = now()
          where id = ${existing[0].id}
        `;
        console.log(`Team upserted: ${name} (${existing[0].id})`);
        continue;
      }

      await tx`
        insert into "Team" (id, name, slug, type, description, active, "createdAt", "updatedAt")
        values (${teamId(name)}, ${name}, ${teamSlug(name)}, 'production', ${`Tim ${name} Produsen Dimsum Medan`}, true, now(), now())
      `;
      console.log(`Team created: ${name} (${teamId(name)})`);
    }
  });
} finally {
  await sql.end();
}
