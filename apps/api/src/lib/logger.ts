interface LogContext {
  [key: string]: unknown;
}

export class Logger {
  private log(level: 'info' | 'warn' | 'error', message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
    
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: LogContext) {
    let errContext = {};
    if (error instanceof Error) {
      errContext = { error: error.message, stack: error.stack };
    } else if (error) {
      errContext = { error: String(error) };
    }
    
    this.log('error', message, { ...context, ...errContext });
  }
}

export const logger = new Logger();
