import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const pinoInstance = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: isProduction ? { env: process.env.NODE_ENV, version: process.env.APP_VERSION || 'unknown' } : undefined,
});

/**
 * Wrapper to adapt existing logger calls: logger.error("Message", { meta }) 
 * to Pino's expected format: pino.error({ meta }, "Message")
 */
export const logger = {
  info: (message: string, meta?: any) => {
    if (meta) pinoInstance.info(meta, message);
    else pinoInstance.info(message);
  },
  error: (message: string, meta?: any) => {
    if (meta) pinoInstance.error(meta, message);
    else pinoInstance.error(message);
  },
  warn: (message: string, meta?: any) => {
    if (meta) pinoInstance.warn(meta, message);
    else pinoInstance.warn(message);
  },
  debug: (message: string, meta?: any) => {
    if (meta) pinoInstance.debug(meta, message);
    else pinoInstance.debug(message);
  },
  fatal: (message: string, meta?: any) => {
    if (meta) pinoInstance.fatal(meta, message);
    else pinoInstance.fatal(message);
  },
};
