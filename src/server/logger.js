import pino from 'pino';

// Log terstruktur (JSON). Field sensitif disensor agar tidak pernah tercatat.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: { app: 'gigspace' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'token',
      'otp',
      '*.password',
      '*.token',
      '*.otp',
      'headers.authorization',
      'headers.cookie',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[DISENSOR]',
  },
});
