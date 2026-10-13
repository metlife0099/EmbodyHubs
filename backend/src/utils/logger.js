import pino from 'pino';
export const logger=pino({level:process.env.LOG_LEVEL||'info',redact:{paths:['req.headers.authorization','req.headers.cookie','password','token','answers','healthProfile','*.password','*.token','*.answers'],censor:'[REDACTED]'}});
