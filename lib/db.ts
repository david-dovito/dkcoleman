import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Neon (Postgres) client. The site reads its content from Neon at build time.
 * Returns null when DATABASE_URL is unset so callers can fall back to sample
 * data in local dev without the DB configured.
 */
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!_sql) _sql = neon(url);
  return _sql;
}
