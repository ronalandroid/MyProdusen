import { describe, expect, it } from 'vitest';
import {
  MAX_VISIBLE_REMINDERS,
  resolveBerandaReminders,
  type BerandaReminderInput,
} from '@/src/components/dashboard/employee/beranda-reminders';

/** Karyawan "sehat": profil lengkap, penugasan lengkap, absensi beres. */
function completeInput(overrides: Partial<BerandaReminderInput> = {}): BerandaReminderInput {
  return {
    hasShift: true,
    hasLocation: true,
    hasProfilePhoto: true,
    hasPhone: true,
    hasAddress: true,
    hasCheckedIn: true,
    hasCheckedOut: true,
    shiftStartTime: '08:00:00',
    shiftEndTime: '16:00:00',
    isOutsideRadius: false,
    now: new Date('2026-07-13T17:00:00'),
    ...overrides,
  };
}

describe('resolveBerandaReminders', () => {
  it('returns no reminders when everything is in order — beranda stays quiet', () => {
    expect(resolveBerandaReminders(completeInput())).toEqual([]);
  });

  it('warns warmly when the shift has not been assigned yet', () => {
    const reminders = resolveBerandaReminders(completeInput({ hasShift: false, shiftStartTime: null, shiftEndTime: null }));

    expect(reminders[0]?.id).toBe('shift-missing');
    expect(reminders[0]?.tone).toBe('warning');
    expect(reminders[0]?.message).toContain('shift');
    expect(reminders[0]?.message).toContain('Superadmin');
  });

  it('warns when the work location has not been assigned yet', () => {
    const reminders = resolveBerandaReminders(completeInput({ hasLocation: false }));

    expect(reminders[0]?.id).toBe('location-missing');
    expect(reminders[0]?.tone).toBe('warning');
    expect(reminders[0]?.message).toContain('Lokasi kerja');
  });

  it('caps the pop-ups so employees are never flooded', () => {
    const reminders = resolveBerandaReminders(
      completeInput({
        hasShift: false,
        shiftStartTime: null,
        shiftEndTime: null,
        hasLocation: false,
        hasProfilePhoto: false,
        hasPhone: false,
      }),
    );

    expect(reminders).toHaveLength(MAX_VISIBLE_REMINDERS);
    expect(reminders.map((r) => r.id)).toEqual(['shift-missing', 'location-missing']);
  });

  it('nudges Clock In once the shift has started and nothing is recorded yet', () => {
    const reminders = resolveBerandaReminders(
      completeInput({ hasCheckedIn: false, hasCheckedOut: false, now: new Date('2026-07-13T09:00:00') }),
    );

    expect(reminders.map((r) => r.id)).toContain('clockin-due');
    expect(reminders.find((r) => r.id === 'clockin-due')?.message).toContain('Clock In');
  });

  it('stays quiet before the shift starts', () => {
    const reminders = resolveBerandaReminders(
      completeInput({ hasCheckedIn: false, hasCheckedOut: false, now: new Date('2026-07-13T07:00:00') }),
    );

    expect(reminders).toEqual([]);
  });

  it('nudges Clock Out after the shift ends while still clocked in', () => {
    const reminders = resolveBerandaReminders(
      completeInput({ hasCheckedIn: true, hasCheckedOut: false, now: new Date('2026-07-13T17:00:00') }),
    );

    expect(reminders.map((r) => r.id)).toContain('clockout-due');
    expect(reminders.find((r) => r.id === 'clockout-due')?.message).toContain('Clock Out');
  });

  it('says nothing about attendance once the day is fully recorded', () => {
    const reminders = resolveBerandaReminders(completeInput({ now: new Date('2026-07-13T18:00:00') }));

    expect(reminders).toEqual([]);
  });

  it('invites the employee to add a profile photo', () => {
    const reminders = resolveBerandaReminders(completeInput({ hasProfilePhoto: false }));

    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.id).toBe('photo-missing');
    expect(reminders[0]?.tone).toBe('info');
    expect(reminders[0]?.message).toContain('foto profil');
    expect(reminders[0]?.message).toContain('Akun');
  });

  it('asks for phone or address when contact details are incomplete', () => {
    const reminders = resolveBerandaReminders(completeInput({ hasPhone: false }));

    expect(reminders[0]?.id).toBe('contact-missing');
    expect(reminders[0]?.message).toContain('nomor HP');
  });

  it('reassures the employee who is outside the radius that attendance still works', () => {
    const reminders = resolveBerandaReminders(
      completeInput({ isOutsideRadius: true, hasCheckedIn: false, hasCheckedOut: false, now: new Date('2026-07-13T09:00:00') }),
    );

    expect(reminders.map((r) => r.id)).toEqual(['clockin-due', 'outside-radius']);
    expect(reminders.find((r) => r.id === 'outside-radius')?.message).toContain('keterangan');
  });

  it('handles overnight shifts across midnight', () => {
    const night = { shiftStartTime: '22:00:00', shiftEndTime: '06:00:00' };

    const beforeMidnight = resolveBerandaReminders(
      completeInput({ ...night, hasCheckedIn: false, hasCheckedOut: false, now: new Date('2026-07-13T23:00:00') }),
    );
    expect(beforeMidnight.map((r) => r.id)).toContain('clockin-due');

    const morningAfter = resolveBerandaReminders(
      completeInput({ ...night, hasCheckedIn: true, hasCheckedOut: false, now: new Date('2026-07-13T07:00:00') }),
    );
    expect(morningAfter.map((r) => r.id)).toContain('clockout-due');
  });
});
