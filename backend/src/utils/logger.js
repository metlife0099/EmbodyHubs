import pino from 'pino';
export const logger=pino({level:process.env.LOG_LEVEL||'info',redact:{paths:['req.headers.authorization','req.headers.cookie','password','currentPassword','newPassword','token','answers','healthProfile','*.password','*.currentPassword','*.newPassword','*.token','*.answers'],censor:'[REDACTED]'}});
