import { db, users, employees, workLocations, shifts, kpiTemplates, kpiItems } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting seed...');

  // Create Superadmin
  const seedPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  const seedHrPassword = process.env.SEED_ADMIN_HR_PASSWORD;
  const seedSupervisorPassword = process.env.SEED_SUPERVISOR_PASSWORD;
  const seedEmployeePassword = process.env.SEED_EMPLOYEE_PASSWORD;

  if (
    !seedPassword ||
    !seedHrPassword ||
    !seedSupervisorPassword ||
    !seedEmployeePassword ||
    [seedPassword, seedHrPassword, seedSupervisorPassword, seedEmployeePassword].some((value) => value.length < 12)
  ) {
    throw new Error('Seed passwords must be set and at least 12 characters');
  }

  const superadminPassword = await bcrypt.hash(seedPassword, 10);
  const superadminId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const [superadmin] = await db
    .insert(users)
    .values({
      id: superadminId,
      email: 'admin@myprodusen.com',
      username: 'superadmin',
      password: superadminPassword,
      role: 'SUPERADMIN',
    })
    .returning();

  const superadminEmpId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(employees).values({
    id: superadminEmpId,
    nip: '260514-0001',
    userId: superadmin.id,
    fullName: 'Super Admin',
    email: 'admin@myprodusen.com',
    phone: '081234567890',
    address: 'Medan, Sumatera Utara',
    joinDate: new Date('2026-05-14'),
    division: 'Management',
    position: 'Owner',
    status: 'ACTIVE',
  });
  console.log('✅ Superadmin created:', superadmin.email);

  // Create Admin HR
  const hrPassword = await bcrypt.hash(seedHrPassword, 10);
  const hrId = `user_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;
  
  const [adminHR] = await db
    .insert(users)
    .values({
      id: hrId,
      email: 'hr@myprodusen.com',
      username: 'adminhr',
      password: hrPassword,
      role: 'ADMIN_HR',
    })
    .returning();

  const hrEmpId = `emp_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(employees).values({
    id: hrEmpId,
    nip: '260514-0002',
    userId: adminHR.id,
    fullName: 'Admin HR',
    email: 'hr@myprodusen.com',
    phone: '081234567891',
    address: 'Medan, Sumatera Utara',
    joinDate: new Date('2026-05-14'),
    division: 'Human Resources',
    position: 'HR Manager',
    status: 'ACTIVE',
  });
  console.log('✅ Admin HR created:', adminHR.email);

  // Create Work Location
  const locationId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const [workLocation] = await db
    .insert(workLocations)
    .values({
      id: locationId,
      name: 'Pabrik Dimsum Medan',
      address: 'Jl. Gatot Subroto No. 123, Medan',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 100,
      isActive: true,
    })
    .returning();
  console.log('✅ Work location created:', workLocation.name);

  // Create Shifts
  const morningShiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const [morningShift] = await db
    .insert(shifts)
    .values({
      id: morningShiftId,
      name: 'Shift Pagi',
      startTime: '08:00',
      endTime: '16:00',
      isActive: true,
    })
    .returning();
  console.log('✅ Morning shift created:', morningShift.name);

  const afternoonShiftId = `shift_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;
  const [afternoonShift] = await db
    .insert(shifts)
    .values({
      id: afternoonShiftId,
      name: 'Shift Siang',
      startTime: '14:00',
      endTime: '22:00',
      isActive: true,
    })
    .returning();
  console.log('✅ Afternoon shift created:', afternoonShift.name);

  // Create Supervisor
  const supervisorPassword = await bcrypt.hash(seedSupervisorPassword, 10);
  const supervisorId = `user_${Date.now() + 2}_${Math.random().toString(36).substr(2, 9)}`;
  
  const [supervisor] = await db
    .insert(users)
    .values({
      id: supervisorId,
      email: 'supervisor@myprodusen.com',
      username: 'supervisor',
      password: supervisorPassword,
      role: 'SUPERVISOR',
    })
    .returning();

  const supervisorEmpId = `emp_${Date.now() + 2}_${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(employees).values({
    id: supervisorEmpId,
    nip: '260514-0003',
    userId: supervisor.id,
    fullName: 'Supervisor Produksi',
    email: 'supervisor@myprodusen.com',
    phone: '081234567892',
    address: 'Medan, Sumatera Utara',
    joinDate: new Date('2026-05-14'),
    division: 'Produksi',
    position: 'Supervisor',
    status: 'ACTIVE',
    defaultShiftId: morningShift.id,
    defaultLocationId: workLocation.id,
  });
  console.log('✅ Supervisor created:', supervisor.email);

  // Create Employees
  const employeePassword = await bcrypt.hash(seedEmployeePassword, 10);
  
  const employee1Id = `user_${Date.now() + 3}_${Math.random().toString(36).substr(2, 9)}`;
  const [employee1] = await db
    .insert(users)
    .values({
      id: employee1Id,
      email: 'employee1@myprodusen.com',
      username: 'employee1',
      password: employeePassword,
      role: 'EMPLOYEE',
    })
    .returning();

  const emp1Id = `emp_${Date.now() + 3}_${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(employees).values({
    id: emp1Id,
    nip: '260514-0004',
    userId: employee1.id,
    fullName: 'Karyawan Satu',
    email: 'employee1@myprodusen.com',
    phone: '081234567893',
    address: 'Medan, Sumatera Utara',
    joinDate: new Date('2026-05-14'),
    division: 'Produksi',
    position: 'Operator',
    status: 'ACTIVE',
    supervisorId: supervisorEmpId,
    defaultShiftId: morningShift.id,
    defaultLocationId: workLocation.id,
  });
  console.log('✅ Employee 1 created:', employee1.email);

  const employee2Id = `user_${Date.now() + 4}_${Math.random().toString(36).substr(2, 9)}`;
  const [employee2] = await db
    .insert(users)
    .values({
      id: employee2Id,
      email: 'employee2@myprodusen.com',
      username: 'employee2',
      password: employeePassword,
      role: 'EMPLOYEE',
    })
    .returning();

  const emp2Id = `emp_${Date.now() + 4}_${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(employees).values({
    id: emp2Id,
    nip: '260514-0005',
    userId: employee2.id,
    fullName: 'Karyawan Dua',
    email: 'employee2@myprodusen.com',
    phone: '081234567894',
    address: 'Medan, Sumatera Utara',
    joinDate: new Date('2026-05-14'),
    division: 'Produksi',
    position: 'Operator',
    status: 'ACTIVE',
    supervisorId: supervisorEmpId,
    defaultShiftId: afternoonShift.id,
    defaultLocationId: workLocation.id,
  });
  console.log('✅ Employee 2 created:', employee2.email);

  // Create KPI Template
  const kpiTemplateId = `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const [kpiTemplate] = await db
    .insert(kpiTemplates)
    .values({
      id: kpiTemplateId,
      name: 'KPI Produksi Bulanan',
      description: 'Template KPI untuk karyawan produksi',
      isActive: true,
    })
    .returning();

  // Create KPI Items
  await db.insert(kpiItems).values([
    {
      id: `kpi_item_${Date.now()}_1`,
      templateId: kpiTemplate.id,
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
      id: `kpi_item_${Date.now()}_2`,
      templateId: kpiTemplate.id,
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
      id: `kpi_item_${Date.now()}_3`,
      templateId: kpiTemplate.id,
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
      id: `kpi_item_${Date.now()}_4`,
      templateId: kpiTemplate.id,
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
  console.log('✅ KPI Template created:', kpiTemplate.name);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials use seed password environment variables.');
  console.log('Superadmin: admin@myprodusen.com / <SEED_SUPERADMIN_PASSWORD>');
  console.log('Admin HR: hr@myprodusen.com / <SEED_ADMIN_HR_PASSWORD>');
  console.log('Supervisor: supervisor@myprodusen.com / <SEED_SUPERVISOR_PASSWORD>');
  console.log('Employee 1: employee1@myprodusen.com / <SEED_EMPLOYEE_PASSWORD>');
  console.log('Employee 2: employee2@myprodusen.com / <SEED_EMPLOYEE_PASSWORD>');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
