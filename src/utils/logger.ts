type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>, requestId?: string): string {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(requestId && { requestId }),
      ...(meta && meta)
    };
    return JSON.stringify(logEntry);
  }

  info(message: string, meta?: Record<string, unknown>, requestId?: string): void {
    console.log(this.formatMessage('info', message, meta, requestId));
  }

  warn(message: string, meta?: Record<string, unknown>, requestId?: string): void {
    console.warn(this.formatMessage('warn', message, meta, requestId));
  }

  error(message: string, error?: Error, requestId?: string): void {
    const meta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : undefined;
    console.error(this.formatMessage('error', message, meta, requestId));
  }

  debug(message: string, meta?: Record<string, unknown>, requestId?: string): void {
    console.debug(this.formatMessage('debug', message, meta, requestId));
  }
}

export const logger = new Logger();
