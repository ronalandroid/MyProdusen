import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

// Idempotent seed for attendance shifts + work locations + shift-location links.
// Safe additive only: no DROP/DELETE/TRUNCATE. Re-runnable.

const LOCATIONS = [
  {
    id: 'loc_pabrik_utama',
    name: 'Pabrik Utama',
    address: 'Jl. Industri No. 1, Medan',
    latitude: 3.6009125,
    longitude: 98.6964954,
    radius: 150,
  },
  {
    id: 'loc_gudang_packing',
    name: 'Gudang Packing',
    address: 'Jl. Logistik No. 8, Medan',
    latitude: 3.6021,
    longitude: 98.6978,
    radius: 120,
  },
];

const SHIFTS = [
  {
    id: 'shift_produksi_pagi',
    name: 'Produksi Pagi',
    startTime: '08:00',
    endTime: '16:00',
    lateToleranceMinutes: 15,
    isSpecialShift: false,
    locationIds: ['loc_pabrik_utama'],
  },
  {
    id: 'shift_packing_sore',
    name: 'Packing Sore',
    startTime: '13:00',
    endTime: '21:00',
    lateToleranceMinutes: 15,
    isSpecialShift: false,
    locationIds: ['loc_gudang_packing', 'loc_pabrik_utama'],
  },
  {
    id: 'shift_ho_ramadhan',
    name: 'HO Ramadhan',
    startTime: '08:00',
    endTime: '15:00',
    lateToleranceMinutes: 20,
    isSpecialShift: true,
    locationIds: ['loc_pabrik_utama', 'loc_gudang_packing'],
  },
];

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

let locationsSeeded = 0;
let shiftsSeeded = 0;
let shiftLocationsSeeded = 0;

try {
  await sql.begin(async (tx) => {
    for (const loc of LOCATIONS) {
      const existing = await tx`select id from "WorkLocation" where id = ${loc.id} limit 1`;
      if (existing.length === 0) {
        await tx`
          insert into "WorkLocation" (id, name, address, latitude, longitude, radius, "isActive", "createdAt", "updatedAt")
          values (${loc.id}, ${loc.name}, ${loc.address}, ${loc.latitude}, ${loc.longitude}, ${loc.radius}, true, now(), now())
        `;
        locationsSeeded += 1;
      } else {
        await tx`
          update "WorkLocation"
          set name = ${loc.name}, address = ${loc.address}, latitude = ${loc.latitude},
              longitude = ${loc.longitude}, radius = ${loc.radius}, "isActive" = true, "updatedAt" = now()
          where id = ${loc.id}
        `;
      }
    }

    for (const shift of SHIFTS) {
      const existing = await tx`select id from "Shift" where id = ${shift.id} limit 1`;
      if (existing.length === 0) {
        await tx`
          insert into "Shift" (id, name, "startTime", "endTime", "lateToleranceMinutes",
            "checkinOpenMinutesBefore", "checkoutCloseMinutesAfter", "isSpecialShift", "isActive", "createdAt", "updatedAt")
          values (${shift.id}, ${shift.name}, ${shift.startTime}, ${shift.endTime}, ${shift.lateToleranceMinutes},
            60, 60, ${shift.isSpecialShift}, true, now(), now())
        `;
        shiftsSeeded += 1;
      } else {
        await tx`
          update "Shift"
          set name = ${shift.name}, "startTime" = ${shift.startTime}, "endTime" = ${shift.endTime},
              "lateToleranceMinutes" = ${shift.lateToleranceMinutes}, "isSpecialShift" = ${shift.isSpecialShift},
              "isActive" = true, "updatedAt" = now()
          where id = ${shift.id}
        `;
      }

      for (const workLocationId of shift.locationIds) {
        const link = await tx`
          select id from "ShiftLocation" where "shiftId" = ${shift.id} and "workLocationId" = ${workLocationId} limit 1
        `;
        if (link.length === 0) {
          await tx`
            insert into "ShiftLocation" (id, "shiftId", "workLocationId", "createdAt")
            values (${randomUUID()}, ${shift.id}, ${workLocationId}, now())
          `;
          shiftLocationsSeeded += 1;
        }
      }
    }
  });

  console.log(
    JSON.stringify({
      seeded: true,
      locations: locationsSeeded,
      shifts: shiftsSeeded,
      shiftLocations: shiftLocationsSeeded,
      totalLocations: LOCATIONS.length,
      totalShifts: SHIFTS.length,
    }),
  );
} catch (error) {
  console.error('Attendance seed failed:', error?.message || error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
