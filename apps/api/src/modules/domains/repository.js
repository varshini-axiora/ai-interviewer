import { getPool } from '../../prisma/db.js';

export async function listActiveDomains() {
  const result = await getPool().query(
    `
      SELECT id, name, description, is_active AS "isActive"
      FROM interview_domains
      WHERE is_active = true
      ORDER BY name ASC
    `,
  );

  return result.rows;
}

