import { z } from 'zod';

export const createEmployeeSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  address: z.string().optional(),
  joinDate: z.string().or(z.date()),
  division: z.string().optional(),
  position: z.string().optional(),
  supervisorId: z.string().optional(),
  defaultShiftId: z.string().optional(),
  defaultLocationId: z.string().optional(),
  emergencyContact: z.string().optional(),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE']),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
  email: z.string().email('Email tidak valid').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  division: z.string().optional(),
  position: z.string().optional(),
  supervisorId: z.string().optional(),
  defaultShiftId: z.string().optional(),
  defaultLocationId: z.string().optional(),
  emergencyContact: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
