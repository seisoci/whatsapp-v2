/**
 * Simple structured logger
 *
 * Di production: hanya log message + error code (tidak ada stack trace)
 * Di development: log detail lengkap untuk debugging
 */

const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error';

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return isDev
      ? { message: error.message, name: error.name, stack: error.stack }
      : { message: error.message, name: error.name };
  }
  if (typeof error === 'object' && error !== null) {
    // Hindari expose full object di production
    return isDev ? { raw: error } : { message: 'Unknown error object' };
  }
  return { message: String(error) };
}

function log(level: LogLevel, context: string, message: string, meta?: unknown) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
  };

  if (meta !== undefined) {
    entry.error = meta instanceof Error || (typeof meta === 'object' && meta !== null)
      ? formatError(meta)
      : { detail: isDev ? meta : undefined };
  }

  const output = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  info: (context: string, message: string, meta?: unknown) =>
    log('info', context, message, meta),

  warn: (context: string, message: string, meta?: unknown) =>
    log('warn', context, message, meta),

  error: (context: string, message: string, error?: unknown) =>
    log('error', context, message, error),
};
