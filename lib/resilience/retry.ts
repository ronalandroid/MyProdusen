import { logger } from '../logger';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitterFactor: number;
  retryableErrors?: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  exponentialBase: 2,
  jitterFactor: 0.3,
};

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(config.exponentialBase, attempt),
    config.maxDelay
  );

  const jitter = exponentialDelay * config.jitterFactor * (Math.random() - 0.5);
  
  return Math.floor(exponentialDelay + jitter);
}

function isRetryableError(error: unknown, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    return true;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return retryableErrors.some((pattern) => errorMessage.includes(pattern));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName = 'operation'
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === finalConfig.maxRetries) {
        logger.error(`${operationName} failed after ${attempt + 1} attempts`, {
          error,
          attempts: attempt + 1,
        });
        throw error;
      }

      if (!isRetryableError(error, finalConfig.retryableErrors)) {
        logger.warn(`${operationName} failed with non-retryable error`, { error });
        throw error;
      }

      const delay = calculateDelay(attempt, finalConfig);
      
      logger.warn(`${operationName} failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: finalConfig.maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(operation: () => Promise<T>, operationName?: string) =>
    withRetry(operation, config, operationName);
}
