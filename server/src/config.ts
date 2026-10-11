import path from 'node:path';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATA_DIR: z.string().default('data'),
  /** Dossier du build Vite servi en production (SPA). */
  CLIENT_DIST: z.string().default('../client/dist'),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(10, 'ADMIN_PASSWORD doit faire au moins 10 caractères').optional(),
});

export interface Config {
  isProduction: boolean;
  host: string;
  port: number;
  dbPath: string;
  uploadsDir: string;
  clientDist: string;
  admin: { username: string; password: string } | null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.parse(env);
  const dataDir = path.resolve(parsed.DATA_DIR);
  return {
    isProduction: parsed.NODE_ENV === 'production',
    host: parsed.HOST,
    port: parsed.PORT,
    dbPath: path.join(dataDir, 'yellowpicker.db'),
    uploadsDir: path.join(dataDir, 'uploads'),
    clientDist: path.resolve(parsed.CLIENT_DIST),
    admin:
      parsed.ADMIN_USERNAME && parsed.ADMIN_PASSWORD
        ? { username: parsed.ADMIN_USERNAME, password: parsed.ADMIN_PASSWORD }
        : null,
  };
}
