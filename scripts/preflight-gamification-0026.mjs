#!/usr/bin/env node
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL missing. Cannot run gamification migration preflight.');
  process.exit(1);
}

const sql = neon(databaseUrl);
const rows = await sql`select count(*)::int as count from "PerformancePeriod" where "status" = 'ACTIVE'`;
const activeCount = Number(rows[0]?.count ?? 0);

if (activeCount > 1) {
  console.error(`BLOCKED: PerformancePeriod has ${activeCount} ACTIVE rows. Resolve manually before applying 0026_gamification_constraints_settings.sql.`);
  console.error('Manual resolution: choose one active period, audit correction, then change other periods to DRAFT or CLOSED according to business decision. Do not delete period data.');
  process.exit(1);
}

console.log('Gamification 0026 preflight passed: active PerformancePeriod count is safe.');
