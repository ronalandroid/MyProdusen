export type AppErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_USER_INACTIVE'
  | 'AUTH_FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'ACCESS_DENIED'
  | 'TEAM_NOT_ASSIGNED'
  | 'EMPLOYEE_NOT_IN_LEADER_TEAM'
  | 'KPI_ENTRY_DUPLICATE'
  | 'KPI_QUANTITY_INVALID'
  | 'KPI_DATE_INVALID'
  | 'USER_NOT_ACTIVE'
  | 'EMPLOYEE_NOT_FOUND'
  | 'LEADER_PROFILE_INCOMPLETE'
  | 'LOCATION_NOT_ASSIGNED'
  | 'SHIFT_NOT_ASSIGNED'
  | 'ROLE_CHANGE_NOT_ALLOWED'
  | 'CANNOT_SELF_DEMOTE'
  | 'LAST_SUPERADMIN_PROTECTED'
  | 'LEADER_REQUIRES_EMPLOYEE_PROFILE'
  | 'LEADER_REQUIRES_TEAM'
  | 'EMPLOYEE_REQUIRES_LOCATION'
  | 'EMPLOYEE_REQUIRES_SHIFT'
  | 'PROFILE_PHONE_REQUIRED'
  | 'PROFILE_ADDRESS_REQUIRED'
  | 'PROFILE_ADDRESS_TOO_SHORT'
  | 'PROFILE_UPDATE_FORBIDDEN_FIELD';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly expose: boolean;

  constructor(code: AppErrorCode, message: string, status = 400, expose = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.expose = expose;
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError('AUTH_INVALID_CREDENTIALS', message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError('AUTH_FORBIDDEN', message, 403);
  }

  static validation(message = 'Validation error') {
    return new AppError('VALIDATION_ERROR', message, 422);
  }

  static notFound(message = 'Not found') {
    return new AppError('NOT_FOUND', message, 404);
  }

  static rateLimited(message = 'Too many requests') {
    return new AppError('RATE_LIMITED', message, 429);
  }

  static internal(message = 'Internal server error') {
    return new AppError('INTERNAL_ERROR', message, 500, false);
  }
}
