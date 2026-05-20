import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';
import { employees, kpiItems, kpiTemplates, shifts, users, workLocations } from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

function normalizeDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete('schema');
  return url.toString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

const client = postgres(normalizeDatabaseUrl(process.env.DATABASE_URL));
const db = drizzle(client);

async function upsertUser(input: {
  email: string;
  username: string;
  password: string;
  role: 'SUPERADMIN' | 'EMPLOYEE';
}) {
  const [user] = await db
    .insert(users)
    .values({
      id: makeId('user'),
      email: input.email,
      username: input.username,
      password: input.password,
      role: input.role,
      isActive: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        username: input.username,
        password: input.password,
        role: input.role,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

async function upsertEmployee(input: {
  nip: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  division: string;
  position: string;
  defaultShiftId?: string;
  defaultLocationId?: string;
}) {
  await db
    .insert(employees)
    .values({
      id: makeId('emp'),
      nip: input.nip,
      userId: input.userId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      joinDate: new Date('2026-05-14'),
      division: input.division,
      position: input.position,
      status: 'ACTIVE',
      defaultShiftId: input.defaultShiftId,
      defaultLocationId: input.defaultLocationId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: employees.userId,
      set: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        division: input.division,
        position: input.position,
        status: 'ACTIVE',
        defaultShiftId: input.defaultShiftId,
        defaultLocationId: input.defaultLocationId,
        updatedAt: new Date(),
      },
    });
}

async function getOrCreateWorkLocation() {
  const [existing] = await db.select().from(workLocations).where(eq(workLocations.name, 'Pabrik Dimsum Medan')).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(workLocations)
    .values({
      id: makeId('loc'),
      name: 'Pabrik Dimsum Medan',
      address: 'Jl. Gatot Subroto No. 123, Medan',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 100,
      isActive: true,
    })
    .returning();

  return created;
}

async function getOrCreateShift(name: string, startTime: string, endTime: string) {
  const [existing] = await db.select().from(shifts).where(eq(shifts.name, name)).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(shifts)
    .values({
      id: makeId('shift'),
      name,
      startTime,
      endTime,
      isActive: true,
    })
    .returning();

  return created;
}

async function ensureKpiTemplate() {
  const [existing] = await db.select().from(kpiTemplates).where(eq(kpiTemplates.name, 'KPI Produksi Bulanan')).limit(1);
  if (existing) return existing;

  const [template] = await db
    .insert(kpiTemplates)
    .values({
      id: makeId('kpi'),
      name: 'KPI Produksi Bulanan',
      description: 'Template KPI untuk karyawan produksi',
      isActive: true,
    })
    .returning();

  await db.insert(kpiItems).values([
    {
      id: makeId('kpi_item'),
      templateId: template.id,
      name: 'Target Produksi',
      description: 'Jumlah dimsum yang diproduksi',
      weight: 0.4,
      scoringType: 'HIGHER_IS_BETTER',
      targetValue: 1000,
      minValue: 500,
      maxValue: 1500,
      unit: 'pcs',
    },
    {
      id: makeId('kpi_item'),
      templateId: template.id,
      name: 'Kualitas Produk',
      description: 'Persentase produk yang lolos QC',
      weight: 0.3,
      scoringType: 'HIGHER_IS_BETTER',
      targetValue: 95,
      minValue: 80,
      maxValue: 100,
      unit: '%',
    },
    {
      id: makeId('kpi_item'),
      templateId: template.id,
      name: 'Kehadiran',
      description: 'Persentase kehadiran',
      weight: 0.2,
      scoringType: 'HIGHER_IS_BETTER',
      targetValue: 100,
      minValue: 80,
      maxValue: 100,
      unit: '%',
    },
    {
      id: makeId('kpi_item'),
      templateId: template.id,
      name: 'Keterlambatan',
      description: 'Total menit terlambat',
      weight: 0.1,
      scoringType: 'LOWER_IS_BETTER',
      targetValue: 0,
      minValue: 0,
      maxValue: 60,
      unit: 'menit',
    },
  ]);

  return template;
}

async function main() {
  console.log('🌱 Starting idempotent seed...');

  const seedPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  const seedEmployeePassword = process.env.SEED_EMPLOYEE_PASSWORD;

  if (!seedPassword || !seedEmployeePassword || [seedPassword, seedEmployeePassword].some((value) => value.length < 12)) {
    throw new Error('Seed passwords must be set and at least 12 characters');
  }

  const superadminPassword = await bcrypt.hash(seedPassword, 10);
  const employeePassword = await bcrypt.hash(seedEmployeePassword, 10);

  const workLocation = await getOrCreateWorkLocation();
  const morningShift = await getOrCreateShift('Shift Pagi', '08:00', '16:00');
  const afternoonShift = await getOrCreateShift('Shift Siang', '14:00', '22:00');

  const superadmin = await upsertUser({
    email: 'admin@myprodusen.com',
    username: 'superadmin',
    password: superadminPassword,
    role: 'SUPERADMIN',
  });
  await upsertEmployee({
    nip: '260514-0001',
    userId: superadmin.id,
    fullName: 'Super Admin',
    email: 'admin@myprodusen.com',
    phone: '081234567890',
    address: 'Medan, Sumatera Utara',
    division: 'Management',
    position: 'Owner',
  });

  const employee1 = await upsertUser({
    email: 'employee1@myprodusen.com',
    username: 'employee1',
    password: employeePassword,
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    nip: '260514-0004',
    userId: employee1.id,
    fullName: 'Karyawan Satu',
    email: 'employee1@myprodusen.com',
    phone: '081234567893',
    address: 'Medan, Sumatera Utara',
    division: 'Produksi',
    position: 'Operator',
    defaultShiftId: morningShift.id,
    defaultLocationId: workLocation.id,
  });

  const employee2 = await upsertUser({
    email: 'employee2@myprodusen.com',
    username: 'employee2',
    password: employeePassword,
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    nip: '260514-0005',
    userId: employee2.id,
    fullName: 'Karyawan Dua',
    email: 'employee2@myprodusen.com',
    phone: '081234567894',
    address: 'Medan, Sumatera Utara',
    division: 'Produksi',
    position: 'Operator',
    defaultShiftId: afternoonShift.id,
    defaultLocationId: workLocation.id,
  });

  const kpiTemplate = await ensureKpiTemplate();

  console.log('✅ Superadmin ready:', superadmin.email);
  console.log('✅ Employee 1 ready:', employee1.email);
  console.log('✅ Employee 2 ready:', employee2.email);
  console.log('✅ Work location ready:', workLocation.name);
  console.log('✅ Shifts ready:', morningShift.name, '/', afternoonShift.name);
  console.log('✅ KPI template ready:', kpiTemplate.name);
  console.log('🎉 Seed completed successfully. Passwords stay in environment variables.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
    process.exit(0);
  });
