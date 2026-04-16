// In-memory session store for interview sessions
// In production, replace with Supabase/Redis

import { v4 as uuid } from 'uuid';

const sessions = new Map();

export function createSession(userId, role, difficulty) {
  const id = uuid();
  const session = {
    id,
    userId,
    role,
    difficulty,
    status: 'in_progress',
    questions: [],
    responses: [],
    questionHistory: [],
    currentQuestionIndex: 0,
    totalQuestions: 8,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    score: null,
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id) {
  return sessions.get(id) || null;
}

export function updateSession(id, updates) {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates);
  sessions.set(id, session);
  return session;
}

export function addQuestionToSession(sessionId, question) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const qId = uuid();
  const qRecord = {
    id: qId,
    text: question.question,
    type: question.type,
    difficulty: question.difficulty,
    isFollowup: question.isFollowup || false,
    order: session.questions.length + 1,
  };

  session.questions.push(qRecord);
  session.questionHistory.push(question.question);
  session.currentQuestionIndex = session.questions.length;
  sessions.set(sessionId, session);

  return qRecord;
}

export function addResponseToSession(sessionId, questionId, answerText, timeTaken, evaluation) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const response = {
    id: uuid(),
    questionId,
    answerText,
    timeTaken,
    evaluation,
    createdAt: new Date().toISOString(),
  };

  session.responses.push(response);
  sessions.set(sessionId, session);
  return response;
}

export function getUserSessions(userId) {
  const results = [];
  for (const [, session] of sessions) {
    if (session.userId === userId) {
      results.push(session);
    }
  }
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
