import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().min(1, 'MONGODB_DB_NAME is required'),
  ALLOWED_ORIGINS: z.string().optional().default(''),
  JWT_SECRET: z.string().optional().default('your-super-secret-jwt-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().optional().default('7d')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[backend] Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = {
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  mongoDbName: parsed.data.MONGODB_DB_NAME,
  allowedOrigins: parsed.data.ALLOWED_ORIGINS
    ? parsed.data.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [],
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN
};
