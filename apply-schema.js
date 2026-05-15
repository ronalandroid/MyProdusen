import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function applySchema() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync('./drizzle/migrations/0000_clean_mad_thinker.sql', 'utf8');
    
    console.log('Applying schema...');
    await client.unsafe(migrationSQL);
    
    console.log('✅ Schema applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

applySchema();
