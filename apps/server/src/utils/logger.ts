export const logger = {
  info: (event: string, details?: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      event,
      ...details,
    }));
  },
  warn: (event: string, details?: Record<string, any>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      event,
      ...details,
    }));
  },
  error: (event: string, details?: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      event,
      ...details,
    }));
  },
};
