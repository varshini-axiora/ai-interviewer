import { Pool } from 'pg';
import { env } from '../config/env.js';

let pool;

function useSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    return url.hostname.includes('supabase.co');
  } catch {
    return false;
  }
}

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: useSsl(env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return pool;
}

export async function pingDatabase() {
  const client = await getPool().connect();
  try {
    const result = await client.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

