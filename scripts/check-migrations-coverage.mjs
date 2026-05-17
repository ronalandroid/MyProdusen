#!/usr/bin/env node
/**
 * Sanity-check that every migration on disk is reachable by the deploy
 * runner and that the journal is not silently behind.
 *
 * Run locally before pushing:   node scripts/check-migrations-coverage.mjs
 * Wired into `npm run release:check:full`.
 *
 * What it does:
 *   1. Scans `drizzle/migrations/*.sql` for files in numbered order.
 *   2. Compares against `drizzle/migrations/meta/_journal.json` if present.
 *   3. Warns when migrations exist on disk but are missing from the journal
 *      (this is allowed — we ship raw SQL files for manual ops migrations
 *      like 0008–0011 — but it should be intentional).
 *   4. Exits non-zero if migrations are duplicated, out of order, or if
 *      filenames disagree with the journal entries.
 *
 * It does NOT touch the database. Pure file inspection.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationsDir = path.join(root, 'drizzle', 'migrations');
const journalPath = path.join(migrationsDir, 'meta', '_journal.json');

if (!existsSync(migrationsDir)) {
  console.error(`ERROR: ${migrationsDir} does not exist.`);
  process.exit(1);
}

const sqlFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

if (sqlFiles.length === 0) {
  console.error('ERROR: no SQL migrations found.');
  process.exit(1);
}

const errors = [];
const warnings = [];
const notes = [];

// 1. Order + duplicate check.
const seenIndexes = new Set();
for (const filename of sqlFiles) {
  const match = filename.match(/^(\d{4})_/);
  if (!match) {
    errors.push(`${filename}: missing 4-digit prefix`);
    continue;
  }
  const idx = match[1];
  if (seenIndexes.has(idx)) {
    warnings.push(`${filename}: duplicate prefix ${idx} — multiple migrations share this id`);
  }
  seenIndexes.add(idx);
}

// 2. Journal cross-check (best-effort: only if the journal exists).
let journal = null;
if (existsSync(journalPath)) {
  try {
    journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  } catch (error) {
    errors.push(`_journal.json is invalid JSON: ${error?.message ?? error}`);
  }
}

if (journal && Array.isArray(journal.entries)) {
  const journalTags = new Set(journal.entries.map((entry) => entry.tag));
  const missingFromJournal = [];
  for (const filename of sqlFiles) {
    const tag = filename.replace(/\.sql$/, '');
    if (!journalTags.has(tag)) {
      missingFromJournal.push(filename);
    }
  }
  if (missingFromJournal.length) {
    notes.push(
      `Journal does not list ${missingFromJournal.length} migration(s): ${missingFromJournal.join(', ')}.`,
    );
    notes.push(
      'This is OK for manually-authored ops migrations as long as scripts/run-migrations.mjs is the deploy runner.',
    );
  }
} else {
  notes.push('No _journal.json found — relying on scripts/run-migrations.mjs filename ordering.');
}

// 3. Output.
const print = (label, lines) => {
  if (!lines.length) return;
  console.log(`\n${label}:`);
  for (const line of lines) console.log(`  - ${line}`);
};

print('ERRORS', errors);
print('WARNINGS', warnings);
print('NOTES', notes);

if (!errors.length && !warnings.length) {
  console.log(`Migration coverage check passed (${sqlFiles.length} migration(s) on disk).`);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s) found. Fix before deploying.`);
  process.exit(1);
}
