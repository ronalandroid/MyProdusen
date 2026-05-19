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
  role: z.enum(['SUPERADMIN', 'EMPLOYEE']),
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
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResendActivationInput = z.infer<typeof resendActivationSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
