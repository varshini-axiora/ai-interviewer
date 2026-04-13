import { getPool } from '../../prisma/db.js';

export async function createInterview({ candidateUserId, domainId }) {
  const result = await getPool().query(
    `
      INSERT INTO interviews (candidate_user_id, domain_id, status)
      VALUES ($1, $2, 'active')
      RETURNING
        id,
        candidate_user_id AS "candidateUserId",
        domain_id AS "domainId",
        status,
        started_at AS "startedAt",
        ended_at AS "endedAt",
        overall_score AS "overallScore",
        summary,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [candidateUserId, domainId],
  );

  return result.rows[0];
}

export async function getInterviewById(interviewId) {
  const result = await getPool().query(
    `
      SELECT
        i.id,
        i.candidate_user_id AS "candidateUserId",
        i.domain_id AS "domainId",
        d.name AS "domainName",
        i.status,
        i.started_at AS "startedAt",
        i.ended_at AS "endedAt",
        i.overall_score AS "overallScore",
        i.summary,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt"
      FROM interviews i
      LEFT JOIN interview_domains d ON d.id = i.domain_id
      WHERE i.id = $1
      LIMIT 1
    `,
    [interviewId],
  );

  return result.rows[0] ?? null;
}

export async function markInterviewCompleted(interviewId) {
  const result = await getPool().query(
    `
      UPDATE interviews
      SET
        status = 'completed',
        ended_at = NOW(),
        updated_at = NOW(),
        overall_score = (
          SELECT ROUND(AVG(score)::numeric, 2)
          FROM responses
          WHERE interview_id = $1 AND score IS NOT NULL
        )
      WHERE id = $1
      RETURNING
        id,
        status,
        ended_at AS "endedAt",
        overall_score AS "overallScore",
        updated_at AS "updatedAt"
    `,
    [interviewId],
  );

  return result.rows[0] ?? null;
}

