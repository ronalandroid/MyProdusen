import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  UPLOAD_DIR: z.string().min(1, 'UPLOAD_DIR is required').default('./public/uploads'),
  MAX_UPLOAD_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  DEFAULT_GEOFENCE_RADIUS: z.coerce.number().int().positive().default(100),
  SESSION_TIMEOUT_HOURS: z.coerce.number().int().positive().default(8),
  SUPERADMIN_EMAIL: z.string().email().optional(),
  SUPERADMIN_PASSWORD: z.string().min(12).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function validateEnv() {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  if (result.data.NODE_ENV === 'production') {
    const weakSecrets = [
      'your-super-secret-jwt-key-change-this-in-production',
      'change-this-to-a-strong-32-character-secret',
    ];

    if (weakSecrets.includes(result.data.JWT_SECRET)) {
      throw new Error('Invalid environment configuration: JWT_SECRET must be changed for production');
    }
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Lazy-loaded: don't crash at import time during build phase.
// In production the real env vars are available at runtime.
let _env: AppEnv | undefined;
export const env = new Proxy({} as AppEnv, {
  get(_target, prop: string) {
    if (!_env) _env = validateEnv();
    return (_env as Record<string, unknown>)[prop];
  },
});
