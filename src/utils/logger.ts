/**
 * Production-safe logging utility
 * In development, logs to console
 * In production, should send to error tracking service (Sentry, LogRocket, etc.)
 */

const isDevelopment = import.meta.env.DEV;

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export const logger = {
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    }
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (typeof window !== 'undefined' && (window as any).Sentry) {
    //   (window as any).Sentry.captureException(error, { 
    //     extra: { message, ...context } 
    //   });
    // }
    
    // In production, you might want to send to your logging API
    // fetch('/api/logs', {
    //   method: 'POST',
    //   body: JSON.stringify({ level: 'error', message, error, context })
    // }).catch(() => {});
  },
  
  warn: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
  },
  
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
  },
  
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  },
};
