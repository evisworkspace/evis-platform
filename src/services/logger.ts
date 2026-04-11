/**
 * Centralized Logger Service
 * Handles all logging across the application with timestamp support
 * Disables logs in production mode
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[1].slice(0, 8); // HH:mm:ss
};

const shouldLog = (): boolean => {
  return (import.meta as any).env.DEV;
};

const formatLog = (level: LogLevel, msg: string, data?: unknown): void => {
  if (!shouldLog()) return;

  const timestamp = getTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'error':
      console.error(`${prefix} ${msg}`, data);
      break;
    case 'warn':
      console.warn(`${prefix} ${msg}`, data);
      break;
    case 'info':
      console.info(`${prefix} ${msg}`, data);
      break;
    case 'debug':
      console.debug(`${prefix} ${msg}`, data);
      break;
  }
};

export const logger = {
  error: (msg: string, error?: unknown): void => {
    formatLog('error', msg, error);
  },

  warn: (msg: string, data?: unknown): void => {
    formatLog('warn', msg, data);
  },

  info: (msg: string, data?: unknown): void => {
    formatLog('info', msg, data);
  },

  debug: (msg: string, data?: unknown): void => {
    formatLog('debug', msg, data);
  }
};
