import { z } from 'zod';

// Strong password validation
const strongPasswordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka')
  .regex(/[^A-Za-z0-9]/, 'Password harus mengandung minimal 1 karakter khusus');

export const loginSchema = z.object({
  email: z.string().min(1, 'Email atau username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: strongPasswordSchema,
  role: z.enum(['SUPERADMIN', 'LEADER', 'EMPLOYEE']),
});

export const publicRegisterSchema = registerSchema.omit({ role: true });

// Self-service onboarding: karyawan mengisi identitas kerja sendiri saat
// daftar; ROLE tetap di luar jangkauan (selalu EMPLOYEE, diatur Superadmin).
export const instantRegisterSchema = publicRegisterSchema.extend({
  fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(120, 'Nama lengkap maksimal 120 karakter'),
  phone: z.string().trim().max(30, 'Nomor HP maksimal 30 karakter').optional().or(z.literal('').transform(() => undefined)),
  division: z.string().trim().max(100, 'Divisi maksimal 100 karakter').optional().or(z.literal('').transform(() => undefined)),
  position: z.string().trim().max(100, 'Posisi maksimal 100 karakter').optional().or(z.literal('').transform(() => undefined)),
  supervisorId: z.string().trim().max(64).optional().or(z.literal('').transform(() => undefined)),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi tidak cocok',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export const resendActivationSchema = z.object({
  identifier: z.string().min(1, 'Email atau username wajib diisi'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi tidak cocok',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
export type InstantRegisterInput = z.infer<typeof instantRegisterSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResendActivationInput = z.infer<typeof resendActivationSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
