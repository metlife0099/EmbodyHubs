import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/embody_health'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_URL: z.string().url().default('http://localhost:5174'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-only-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-only-refresh-secret-change-me'),
  COOKIE_SECRET: z.string().min(32).default('development-only-cookie-secret-change-me'),
  STRIPE_SECRET_KEY: z.string().optional(), STRIPE_WEBHOOK_SECRET: z.string().optional(),
  USPS_CLIENT_ID: z.string().optional(), USPS_CLIENT_SECRET: z.string().optional(), USPS_BASE_URL: z.string().url().default('https://apis-tem.usps.com')
});
const parsed=schema.safeParse(process.env);
if(!parsed.success){console.error('Invalid environment configuration',parsed.error.flatten().fieldErrors);process.exit(1)}
export const env=parsed.data;
