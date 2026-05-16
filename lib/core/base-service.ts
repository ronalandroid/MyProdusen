import { logger } from '@/lib/logger';
import { AppError } from './app-error';

export abstract class BaseService {
  protected readonly logger = logger;

  protected ensureFound<T>(value: T | null | undefined, message: string): T {
    if (!value) {
      throw AppError.notFound(message);
    }

    return value;
  }

  protected assert(condition: unknown, error: AppError): asserts condition {
    if (!condition) {
      throw error;
    }
  }

  protected sanitizeUnknownError(error: unknown, fallbackMessage: string): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Error) {
      this.logger.error(fallbackMessage, error);
    }
    return AppError.internal(fallbackMessage);
  }
}
