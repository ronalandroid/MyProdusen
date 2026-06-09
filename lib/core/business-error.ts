/**
 * BusinessError — operational, user-facing domain errors.
 *
 * ECC centralized error contract: business errors expose their message to the
 * client (with the right status/code); any OTHER thrown value (DB driver
 * errors, undefined access, network failures) is treated as unexpected and
 * collapsed to a generic 500 by `handleApiError`, so internals never leak.
 *
 * Services should throw `BusinessError` (or `AppError`) for expected failures.
 * Bare `throw new Error(...)` is treated as unexpected and is NOT exposed.
 */
export class BusinessError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly expose = true;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = 'BusinessError';
    this.status = options?.status ?? 400;
    this.code = options?.code;
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}
