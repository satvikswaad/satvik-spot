const SENSITIVE_KEYS = ['password', 'authorization', 'token', 'secret', 'private_key', 'cookie', 'appchecktoken', 'idtoken'];

export function redactSensitiveData(meta?: Record<string, any>): Record<string, any> | undefined {
  if (!meta) return undefined;
  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, any>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...redactSensitiveData(meta) }));
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...redactSensitiveData(meta) }));
  },
  error: (message: string, meta?: Record<string, any>) => {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message, ...redactSensitiveData(meta) }));
  }
};
