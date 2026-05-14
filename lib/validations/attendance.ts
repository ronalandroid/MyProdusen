import { z } from 'zod';

const selfieSchema = z
  .string()
  .min(1, 'Selfie wajib diupload')
  .max(6_000_000, 'Ukuran selfie terlalu besar')
  .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Format selfie tidak valid');

export const checkInSchema = z.object({
  workLocationId: z.string().min(1, 'Lokasi kerja wajib dipilih'),
  shiftId: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  selfie: selfieSchema,
  deviceInfo: z.string().optional(),
});

export const checkOutSchema = z.object({
  attendanceId: z.string().min(1, 'ID absensi wajib diisi'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  selfie: selfieSchema,
  deviceInfo: z.string().optional(),
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
