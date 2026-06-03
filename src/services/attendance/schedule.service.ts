import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
  db,
  employeeSchedules,
  scheduleLocations,
  shiftLocations,
  shifts,
  workLocations,
  employees,
} from '@/lib/db';
import { calculateDistance } from '@/lib/geofencing';

export type ResolvedLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type ResolvedSchedule = {
  id: string | null;
  source: 'schedule' | 'default-shift' | 'none';
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isSpecialShift: boolean;
    lateToleranceMinutes: number;
  } | null;
  locations: ResolvedLocation[];
  date: string;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function dateOnlyUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toLocation(row: typeof workLocations.$inferSelect): ResolvedLocation {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radius,
  };
}

class ScheduleService {
  /**
   * Resolve the effective schedule for an employee on a given date.
   * Priority:
   *   1. EmployeeSchedule for that date (+ its ScheduleLocations, fallback ShiftLocations)
   *   2. employee.defaultShiftId (+ ShiftLocations, fallback employee.defaultLocation)
   *   3. none
   */
  async getScheduleForDate(employeeId: string, date = new Date()): Promise<ResolvedSchedule> {
    const dayStart = dateOnlyUtc(date);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1);
    const isoDate = dayStart.toISOString().slice(0, 10);

    // 1) Per-day schedule
    const schedule = await db.query.employeeSchedules.findFirst({
      where: and(
        eq(employeeSchedules.employeeId, employeeId),
        eq(employeeSchedules.isActive, true),
        gte(employeeSchedules.date, dayStart),
        lt(employeeSchedules.date, new Date(dayEnd.getTime() + 1)),
      ),
    });

    if (schedule) {
      const shift = await db.query.shifts.findFirst({ where: eq(shifts.id, schedule.shiftId) });
      if (shift) {
        let locations = await this.getScheduleLocations(schedule.id);
        if (locations.length === 0) {
          locations = await this.getShiftLocations(shift.id);
        }
        return {
          id: schedule.id,
          source: 'schedule',
          shift: {
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isSpecialShift: shift.isSpecialShift,
            lateToleranceMinutes: shift.lateToleranceMinutes,
          },
          locations,
          date: isoDate,
        };
      }
    }

    // 2) Default shift fallback
    const employee = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
    if (employee?.defaultShiftId) {
      const shift = await db.query.shifts.findFirst({ where: eq(shifts.id, employee.defaultShiftId) });
      if (shift && shift.isActive) {
        let locations = await this.getShiftLocations(shift.id);
        if (locations.length === 0 && employee.defaultLocationId) {
          const loc = await db.query.workLocations.findFirst({
            where: eq(workLocations.id, employee.defaultLocationId),
          });
          if (loc && loc.isActive) locations = [toLocation(loc)];
        }
        return {
          id: null,
          source: 'default-shift',
          shift: {
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isSpecialShift: shift.isSpecialShift,
            lateToleranceMinutes: shift.lateToleranceMinutes,
          },
          locations,
          date: isoDate,
        };
      }
    }

    return { id: null, source: 'none', shift: null, locations: [], date: isoDate };
  }

  async getScheduleLocations(scheduleId: string): Promise<ResolvedLocation[]> {
    const links = await db
      .select({ workLocationId: scheduleLocations.workLocationId })
      .from(scheduleLocations)
      .where(eq(scheduleLocations.scheduleId, scheduleId));
    return this.loadActiveLocations(links.map((l) => l.workLocationId));
  }

  async getShiftLocations(shiftId: string): Promise<ResolvedLocation[]> {
    const links = await db
      .select({ workLocationId: shiftLocations.workLocationId })
      .from(shiftLocations)
      .where(eq(shiftLocations.shiftId, shiftId));
    return this.loadActiveLocations(links.map((l) => l.workLocationId));
  }

  private async loadActiveLocations(ids: string[]): Promise<ResolvedLocation[]> {
    if (ids.length === 0) return [];
    const rows = await db
      .select()
      .from(workLocations)
      .where(and(inArray(workLocations.id, ids), eq(workLocations.isActive, true)));
    return rows.map(toLocation);
  }

  /**
   * Server-side geofence validation against ALL valid locations for the schedule.
   * Returns the nearest valid location and whether the user is within radius.
   */
  validateAgainstLocations(
    userLat: number,
    userLon: number,
    locations: ResolvedLocation[],
  ): {
    valid: boolean;
    nearest: (ResolvedLocation & { distanceMeters: number }) | null;
  } {
    if (locations.length === 0) return { valid: false, nearest: null };
    let nearest: (ResolvedLocation & { distanceMeters: number }) | null = null;
    for (const loc of locations) {
      const distanceMeters = calculateDistance(userLat, userLon, loc.latitude, loc.longitude);
      if (!nearest || distanceMeters < nearest.distanceMeters) {
        nearest = { ...loc, distanceMeters };
      }
    }
    const valid = !!nearest && nearest.distanceMeters <= nearest.radiusMeters;
    return { valid, nearest };
  }

  // ---- Superadmin management ----

  async upsertSchedule(input: {
    employeeId: string;
    shiftId: string;
    date: Date;
    workLocationIds: string[];
    createdBy: string;
  }) {
    const dayStart = dateOnlyUtc(input.date);
    const existing = await db.query.employeeSchedules.findFirst({
      where: and(
        eq(employeeSchedules.employeeId, input.employeeId),
        gte(employeeSchedules.date, dayStart),
        lt(employeeSchedules.date, new Date(dayStart.getTime() + 86_400_000)),
      ),
    });

    let scheduleId: string;
    if (existing) {
      scheduleId = existing.id;
      await db
        .update(employeeSchedules)
        .set({ shiftId: input.shiftId, isActive: true, updatedAt: new Date() })
        .where(eq(employeeSchedules.id, scheduleId));
      // Reset location links (soft replace via delete of join rows only)
      await db.delete(scheduleLocations).where(eq(scheduleLocations.scheduleId, scheduleId));
    } else {
      scheduleId = nanoid();
      await db.insert(employeeSchedules).values({
        id: scheduleId,
        employeeId: input.employeeId,
        shiftId: input.shiftId,
        date: dayStart,
        isActive: true,
        createdBy: input.createdBy,
      });
    }

    for (const workLocationId of [...new Set(input.workLocationIds)]) {
      await db.insert(scheduleLocations).values({
        id: nanoid(),
        scheduleId,
        workLocationId,
      });
    }

    return this.getScheduleForDate(input.employeeId, input.date);
  }

  async deactivateSchedule(scheduleId: string) {
    await db
      .update(employeeSchedules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employeeSchedules.id, scheduleId));
  }

  async setShiftLocations(shiftId: string, workLocationIds: string[]) {
    await db.delete(shiftLocations).where(eq(shiftLocations.shiftId, shiftId));
    for (const workLocationId of [...new Set(workLocationIds)]) {
      await db.insert(shiftLocations).values({ id: nanoid(), shiftId, workLocationId });
    }
    return this.getShiftLocations(shiftId);
  }

  /**
   * Raw work-location ids linked to a shift (default locations), including
   * inactive ones, so Superadmin sees exactly what is configured.
   */
  async getShiftLocationIds(shiftId: string): Promise<string[]> {
    const links = await db
      .select({ workLocationId: shiftLocations.workLocationId })
      .from(shiftLocations)
      .where(eq(shiftLocations.shiftId, shiftId));
    return links.map((l) => l.workLocationId);
  }

  /**
   * List active schedules in a date range [from, to] (inclusive), optionally
   * filtered by employee. Returns each schedule with its shift and the raw
   * work-location ids attached to it. Used by the Superadmin scheduling UI.
   */
  async listSchedulesForRange(input: {
    from: Date;
    to: Date;
    employeeId?: string;
  }): Promise<
    Array<{
      id: string;
      employeeId: string;
      date: string;
      shiftId: string;
      shiftName: string | null;
      workLocationIds: string[];
    }>
  > {
    const rangeStart = dateOnlyUtc(input.from);
    const rangeEnd = new Date(dateOnlyUtc(input.to).getTime() + 86_400_000);

    const conditions = [
      eq(employeeSchedules.isActive, true),
      gte(employeeSchedules.date, rangeStart),
      lt(employeeSchedules.date, rangeEnd),
    ];
    if (input.employeeId) {
      conditions.push(eq(employeeSchedules.employeeId, input.employeeId));
    }

    const rows = await db
      .select({
        id: employeeSchedules.id,
        employeeId: employeeSchedules.employeeId,
        shiftId: employeeSchedules.shiftId,
        dateText: sql<string>`${employeeSchedules.date}::text`,
      })
      .from(employeeSchedules)
      .where(and(...conditions));

    if (rows.length === 0) return [];

    const shiftIds = [...new Set(rows.map((r) => r.shiftId))];
    const shiftRows = await db
      .select({ id: shifts.id, name: shifts.name })
      .from(shifts)
      .where(inArray(shifts.id, shiftIds));
    const shiftNameById = new Map(shiftRows.map((s) => [s.id, s.name]));

    const scheduleIds = rows.map((r) => r.id);
    const locationLinks = await db
      .select({
        scheduleId: scheduleLocations.scheduleId,
        workLocationId: scheduleLocations.workLocationId,
      })
      .from(scheduleLocations)
      .where(inArray(scheduleLocations.scheduleId, scheduleIds));
    const locationsBySchedule = new Map<string, string[]>();
    for (const link of locationLinks) {
      const list = locationsBySchedule.get(link.scheduleId) ?? [];
      list.push(link.workLocationId);
      locationsBySchedule.set(link.scheduleId, list);
    }

    return rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      date: row.dateText.slice(0, 10),
      shiftId: row.shiftId,
      shiftName: shiftNameById.get(row.shiftId) ?? null,
      workLocationIds: locationsBySchedule.get(row.id) ?? [],
    }));
  }
}

export const scheduleService = new ScheduleService();
