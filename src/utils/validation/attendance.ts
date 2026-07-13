import { z } from 'zod';

export const checkInSchema = z.object({
  workLocationId: z.string().min(1, 'Lokasi kerja wajib dipilih'),
  shiftId: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  livenessScore: z.number().min(0).max(1).default(0),
  livenessPassed: z.boolean().default(false),
  // Optional, additive: sent by the real (MediaPipe) client. Left optional so
  // current clients stay backward-compatible — the service infers faceDetected
  // from livenessPassed when these are absent.
  faceDetected: z.boolean().optional(),
  livenessUnsupported: z.boolean().optional(),
  deviceInfo: z.string().optional(),
  gpsTimestamp: z.string().optional(),
  note: z.string().max(150).optional(),
  // Written justification required to attend from OUTSIDE the geo-fence radius.
  manualReason: z.string().max(300).optional(),
});

export const checkOutSchema = z.object({
  attendanceId: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  livenessScore: z.number().min(0).max(1).default(0),
  livenessPassed: z.boolean().default(false),
  faceDetected: z.boolean().optional(),
  livenessUnsupported: z.boolean().optional(),
  deviceInfo: z.string().optional(),
  gpsTimestamp: z.string().optional(),
  note: z.string().max(150).optional(),
  // Written justification required to attend from OUTSIDE the geo-fence radius.
  manualReason: z.string().max(300).optional(),
  // Written justification required when clocking out past the grace window.
  lateReason: z.string().max(300).optional(),
});

export const manualAttendanceSchema = z.object({
  employeeId: z.string().min(1, 'ID karyawan wajib diisi'),
  workLocationId: z.string().min(1, 'Lokasi kerja wajib dipilih'),
  shiftId: z.string().optional(),
  checkInTime: z.string().or(z.date()),
  checkOutTime: z.string().or(z.date()).optional(),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'SICK', 'PERMISSION']),
});

export const updateAttendanceSchema = z.object({
  checkInTime: z.string().or(z.date()).optional(),
  checkOutTime: z.string().or(z.date()).optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'SICK', 'PERMISSION']).optional(),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
