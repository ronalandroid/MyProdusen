/**
 * Production-ready logging system
 * Supports different log levels and structured logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...context }
      : { error, ...context };
    
    console.error(this.formatMessage(LogLevel.ERROR, message, errorDetails));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Log API requests
  logRequest(method: string, url: string, userId?: string): void {
    this.info('API Request', { method, url, userId });
  }

  // Log API responses
  logResponse(method: string, url: string, status: number, duration: number): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this[level]('API Response', { method, url, status, duration: `${duration}ms` });
  }

  // Log database queries
  logQuery(query: string, duration: number): void {
    if (this.isDevelopment) {
      this.debug('Database Query', { query: query.substring(0, 100), duration: `${duration}ms` });
    }
  }
}

export const logger = new Logger();
