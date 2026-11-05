import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Small .env loader so the project does not need another runtime dependency.
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

export const config = {
  port: Number(process.env.API_PORT || 5001),
  pg: {
     host: process.env.PGHOST || 'localhost',
     port: Number(process.env.PGPORT || 5432),
     database: process.env.PGDATABASE || 'isats',
     user: process.env.PGUSER || 'postgres',
     password: process.env.PGPASSWORD || '',
     max: Number(process.env.PGPOOL_MAX || 10),
     ssl: {
       ca: readFileSync(
         path.join(__dirname, 'certs', 'prod-ca-2021.crt'),
         'utf8'
        ),
        rejectUnauthorized: true,
      },
  },
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  appOrigin: (process.env.APP_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${Number(process.env.API_PORT || 5001)}/api/auth/google/callback`,
  },
};
