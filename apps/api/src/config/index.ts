import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  DATABASE_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const config = {
  env: _env.data.NODE_ENV,
  port: parseInt(_env.data.PORT, 10),
  auth: {
    jwtSecret: _env.data.JWT_SECRET,
  },
  db: {
    url: _env.data.DATABASE_URL,
  },
  sentry: {
    dsn: _env.data.SENTRY_DSN,
  }
};
