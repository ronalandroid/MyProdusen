import { createHash } from 'node:crypto';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
    throw error;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '..', 'drizzle', 'migrations');
const trackingTable = '_myprodusen_migrations';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required to run migrations');
  process.exit(1);
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

function extractCreatedObjects(content) {
  const objects = [];
  const tablePattern = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+\"([^\"]+)\"/gi;
  const typePattern = /CREATE\s+TYPE\s+(?:\"public\"\.)?\"([^\"]+)\"/gi;
  const indexPattern = /CREATE\s+(?:UNIQUE\s+)?INDEX(?:\s+IF\s+NOT\s+EXISTS)?\s+\"([^\"]+)\"/gi;

  for (const match of content.matchAll(tablePattern)) {
    objects.push({ kind: 'relation', name: match[1] });
  }

  for (const match of content.matchAll(typePattern)) {
    objects.push({ kind: 'type', name: match[1] });
  }

  for (const match of content.matchAll(indexPattern)) {
    objects.push({ kind: 'relation', name: match[1] });
  }

  return objects;
}

function sanitizeError(error) {
  const normalizedUrl = normalizeDatabaseUrl(databaseUrl);
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replaceAll(databaseUrl, '[DATABASE_URL]')
    .replaceAll(normalizedUrl, '[DATABASE_URL]')
    .replace(/postgresql:\/\/[^\s@]+@/g, 'postgresql://[REDACTED]@')
    .replace(/redis:\/\/[^\s@]+@/g, 'redis://[REDACTED]@');
}

async function createdObjectsExist(objects) {
  if (objects.length === 0) {
    return false;
  }

  for (const object of objects) {
    if (object.kind === 'type') {
      const rows = await sql`
        select 1
        from pg_type t
        join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public' and t.typname = ${object.name}
        limit 1
      `;

      if (rows.length === 0) {
        return false;
      }

      continue;
    }

    const rows = await sql`
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = ${object.name}
      limit 1
    `;

    if (rows.length === 0) {
      return false;
    }
  }

  return true;
}

const sql = postgres(normalizeDatabaseUrl(databaseUrl), {
  max: 1,
  onnotice: () => undefined,
});

try {
  await sql`select pg_advisory_lock(hashtext('myprodusen:migrations'))`;

  await sql.unsafe(`
    create table if not exists "${trackingTable}" (
      id serial primary key,
      filename text not null unique,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);

  await access(migrationsDir);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    console.log('No SQL migrations found');
  }

  for (const file of files) {
    const content = await readFile(path.join(migrationsDir, file), 'utf8');
    const digest = checksum(content);
    const [existingMigration] = await sql.unsafe(
      `select checksum from "${trackingTable}" where filename = $1 limit 1`,
      [file],
    );

    if (existingMigration) {
      if (existingMigration.checksum !== digest) {
        throw new Error(`Migration checksum mismatch for ${file}`);
      }
      console.log(`Migration skipped: ${file}`);
      continue;
    }

    const createdObjects = extractCreatedObjects(content);
    if (await createdObjectsExist(createdObjects)) {
      console.log(`Migration baselined: ${file}`);
      await sql.unsafe(
        `insert into "${trackingTable}" (filename, checksum) values ($1, $2)`,
        [file, digest],
      );
      continue;
    }

    console.log(`Migration applying: ${file}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx.unsafe(
        `insert into "${trackingTable}" (filename, checksum) values ($1, $2)`,
        [file, digest],
      );
    });
    console.log(`Migration applied: ${file}`);
  }

  console.log('Database migrations complete');
} catch (error) {
  console.error('ERROR: Database migration failed');
  console.error(sanitizeError(error));
  process.exitCode = 1;
} finally {
  try {
    await sql`select pg_advisory_unlock(hashtext('myprodusen:migrations'))`;
  } catch (_error) {
    // Connection may already be closed after a fatal migration error.
  }
  await sql.end({ timeout: 5 }).catch(() => undefined);
}
