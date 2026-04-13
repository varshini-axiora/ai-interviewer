import { getPool } from '../../prisma/db.js';

export async function createResponse({ interviewId, questionText, answerText, score, feedback }) {
  const result = await getPool().query(
    `
      INSERT INTO responses (interview_id, question_text, answer_text, score, feedback)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        interview_id AS "interviewId",
        question_text AS "questionText",
        answer_text AS "answerText",
        score,
        feedback,
        created_at AS "createdAt"
    `,
    [interviewId, questionText, answerText, score, feedback],
  );

  await getPool().query(
    `
      UPDATE interviews
      SET
        updated_at = NOW(),
        overall_score = (
          SELECT ROUND(AVG(score)::numeric, 2)
          FROM responses
          WHERE interview_id = $1 AND score IS NOT NULL
        )
      WHERE id = $1
    `,
    [interviewId],
  );

  return result.rows[0];
}

export async function getScoresByInterview(interviewId) {
  const result = await getPool().query(
    `
      SELECT
        id,
        question_text AS "questionText",
        score,
        feedback,
        created_at AS "createdAt"
      FROM responses
      WHERE interview_id = $1
      ORDER BY created_at ASC
    `,
    [interviewId],
  );

  return result.rows;
}

