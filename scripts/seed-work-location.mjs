import postgres from 'postgres';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

const OFFICIAL_LOCATION = {
  id: 'loc_produsen_dimsum_medan_tbm_grup',
  name: 'Produsen Dimsum Medan | TBM GRUP',
  latitude: 3.6009345479119634,
  longitude: 98.69649918030287,
  // Attendance within 150 m of the coordinate is accepted directly; beyond it
  // routes to admin geo-review.
  radius: 150,
};

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

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1 });

try {
  await sql.begin(async (tx) => {
    const existing = await tx`
      select id, address
      from "WorkLocation"
      where name = ${OFFICIAL_LOCATION.name} or id = ${OFFICIAL_LOCATION.id}
      order by case when id = ${OFFICIAL_LOCATION.id} then 0 else 1 end
      limit 1
    `;

    const address = existing[0]?.address || OFFICIAL_LOCATION.name;

    if (existing.length > 0) {
      await tx`
        update "WorkLocation"
        set name = ${OFFICIAL_LOCATION.name},
            address = ${address},
            latitude = ${OFFICIAL_LOCATION.latitude},
            longitude = ${OFFICIAL_LOCATION.longitude},
            radius = ${OFFICIAL_LOCATION.radius},
            "isActive" = true,
            "updatedAt" = now()
        where id = ${existing[0].id}
      `;
      console.log(`Official work location updated: ${existing[0].id}`);
      return;
    }

    await tx`
      insert into "WorkLocation" (id, name, address, latitude, longitude, radius, "isActive", "createdAt", "updatedAt")
      values (${OFFICIAL_LOCATION.id}, ${OFFICIAL_LOCATION.name}, ${address}, ${OFFICIAL_LOCATION.latitude}, ${OFFICIAL_LOCATION.longitude}, ${OFFICIAL_LOCATION.radius}, true, now(), now())
    `;
    console.log(`Official work location created: ${OFFICIAL_LOCATION.id}`);
  });
} finally {
  await sql.end();
}
