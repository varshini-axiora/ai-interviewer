import { getPool, closeDatabase } from './db.js';

const statements = [
  'CREATE EXTENSION IF NOT EXISTS pgcrypto',
  `
    CREATE TABLE IF NOT EXISTS interview_domains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS interviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_user_id TEXT NOT NULL,
      domain_id UUID REFERENCES interview_domains(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      overall_score NUMERIC(5,2),
      summary TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      answer_text TEXT NOT NULL,
      score NUMERIC(5,2),
      feedback TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  'CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status)',
  'CREATE INDEX IF NOT EXISTS idx_responses_interview_id ON responses(interview_id)',
  `
    INSERT INTO interview_domains (name, description)
    VALUES
      ('Technical', 'Technical interview track'),
      ('HR', 'Human resources and behavioral track')
    ON CONFLICT (name) DO NOTHING
  `,
];

async function main() {
  const pool = getPool();

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log('Database schema initialized successfully.');
}

main()
  .catch((error) => {
    console.error('Failed to initialize database schema:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });

