import { PrismaClient, UserRole, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Superadmin
  const superadminPassword = await bcrypt.hash('admin123', 10);
  const superadmin = await prisma.user.create({
    data: {
      email: 'admin@myprodusen.com',
      username: 'superadmin',
      password: superadminPassword,
      role: UserRole.SUPERADMIN,
      employee: {
        create: {
          nip: '260514-0001',
          fullName: 'Super Admin',
          email: 'admin@myprodusen.com',
          phone: '081234567890',
          address: 'Medan, Sumatera Utara',
          joinDate: new Date('2026-05-14'),
          division: 'Management',
          position: 'Owner',
          status: EmployeeStatus.ACTIVE,
        },
      },
    },
  });
  console.log('✅ Superadmin created:', superadmin.email);

  // Create Admin HR
  const hrPassword = await bcrypt.hash('hr123', 10);
  const adminHR = await prisma.user.create({
    data: {
      email: 'hr@myprodusen.com',
      username: 'adminhr',
      password: hrPassword,
      role: UserRole.ADMIN_HR,
      employee: {
        create: {
          nip: '260514-0002',
          fullName: 'Admin HR',
          email: 'hr@myprodusen.com',
          phone: '081234567891',
          address: 'Medan, Sumatera Utara',
          joinDate: new Date('2026-05-14'),
          division: 'Human Resources',
          position: 'HR Manager',
          status: EmployeeStatus.ACTIVE,
        },
      },
    },
  });
  console.log('✅ Admin HR created:', adminHR.email);

  // Create Work Location
  const workLocation = await prisma.workLocation.create({
    data: {
      name: 'Pabrik Dimsum Medan',
      address: 'Jl. Gatot Subroto No. 123, Medan',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 100,
      isActive: true,
    },
  });
  console.log('✅ Work location created:', workLocation.name);

  // Create Shifts
  const morningShift = await prisma.shift.create({
    data: {
      name: 'Shift Pagi',
      startTime: '08:00',
      endTime: '16:00',
      isActive: true,
    },
  });
  console.log('✅ Morning shift created:', morningShift.name);

  const afternoonShift = await prisma.shift.create({
    data: {
      name: 'Shift Siang',
      startTime: '14:00',
      endTime: '22:00',
      isActive: true,
    },
  });
  console.log('✅ Afternoon shift created:', afternoonShift.name);

  // Create Supervisor
  const supervisorPassword = await bcrypt.hash('supervisor123', 10);
  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@myprodusen.com',
      username: 'supervisor',
      password: supervisorPassword,
      role: UserRole.SUPERVISOR,
      employee: {
        create: {
          nip: '260514-0003',
          fullName: 'Supervisor Produksi',
          email: 'supervisor@myprodusen.com',
          phone: '081234567892',
          address: 'Medan, Sumatera Utara',
          joinDate: new Date('2026-05-14'),
          division: 'Produksi',
          position: 'Supervisor',
          status: EmployeeStatus.ACTIVE,
          defaultShiftId: morningShift.id,
          defaultLocationId: workLocation.id,
        },
      },
    },
  });
  console.log('✅ Supervisor created:', supervisor.email);

  // Create Employees
  const employeePassword = await bcrypt.hash('employee123', 10);
  
  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@myprodusen.com',
      username: 'employee1',
      password: employeePassword,
      role: UserRole.EMPLOYEE,
      employee: {
        create: {
          nip: '260514-0004',
          fullName: 'Karyawan Satu',
          email: 'employee1@myprodusen.com',
          phone: '081234567893',
          address: 'Medan, Sumatera Utara',
          joinDate: new Date('2026-05-14'),
          division: 'Produksi',
          position: 'Operator',
          status: EmployeeStatus.ACTIVE,
          supervisorId: (await prisma.employee.findUnique({ where: { userId: supervisor.id } }))?.id,
          defaultShiftId: morningShift.id,
          defaultLocationId: workLocation.id,
        },
      },
    },
  });
  console.log('✅ Employee 1 created:', employee1.email);

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@myprodusen.com',
      username: 'employee2',
      password: employeePassword,
      role: UserRole.EMPLOYEE,
      employee: {
        create: {
          nip: '260514-0005',
          fullName: 'Karyawan Dua',
          email: 'employee2@myprodusen.com',
          phone: '081234567894',
          address: 'Medan, Sumatera Utara',
          joinDate: new Date('2026-05-14'),
          division: 'Produksi',
          position: 'Operator',
          status: EmployeeStatus.ACTIVE,
          supervisorId: (await prisma.employee.findUnique({ where: { userId: supervisor.id } }))?.id,
          defaultShiftId: afternoonShift.id,
          defaultLocationId: workLocation.id,
        },
      },
    },
  });
  console.log('✅ Employee 2 created:', employee2.email);

  // Create KPI Template
  const kpiTemplate = await prisma.kpiTemplate.create({
    data: {
      name: 'KPI Produksi Bulanan',
      description: 'Template KPI untuk karyawan produksi',
      isActive: true,
      items: {
        create: [
          {
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
            name: 'Keterlambatan',
            description: 'Total menit terlambat',
            weight: 0.1,
            scoringType: 'LOWER_IS_BETTER',
            targetValue: 0,
            minValue: 0,
            maxValue: 60,
            unit: 'menit',
          },
        ],
      },
    },
  });
  console.log('✅ KPI Template created:', kpiTemplate.name);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Superadmin: admin@myprodusen.com / admin123');
  console.log('Admin HR: hr@myprodusen.com / hr123');
  console.log('Supervisor: supervisor@myprodusen.com / supervisor123');
  console.log('Employee 1: employee1@myprodusen.com / employee123');
  console.log('Employee 2: employee2@myprodusen.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
