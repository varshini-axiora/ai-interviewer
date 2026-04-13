import { z } from 'zod';
import { readJsonBody, sendJson } from '../../common/http.js';
import { getInterviewById } from '../interviews/repository.js';
import { createResponse, getScoresByInterview } from './repository.js';
import { scoreAnswer } from './service.js';

const createResponseSchema = z.object({
  questionText: z.string().min(5),
  answerText: z.string().min(1),
});

export async function handleCreateResponse(req, res, interviewId) {
  const interview = await getInterviewById(interviewId);

  if (!interview) {
    sendJson(res, 404, { ok: false, error: 'Interview not found' });
    return;
  }

  if (interview.status === 'completed') {
    sendJson(res, 409, { ok: false, error: 'Interview already completed' });
    return;
  }

  const body = await readJsonBody(req);
  const parsed = createResponseSchema.safeParse(body);

  if (!parsed.success) {
    sendJson(res, 400, { ok: false, error: parsed.error.flatten() });
    return;
  }

  const evaluation = scoreAnswer(parsed.data.answerText);
  const response = await createResponse({
    interviewId,
    questionText: parsed.data.questionText,
    answerText: parsed.data.answerText,
    score: evaluation.score,
    feedback: evaluation.feedback,
  });

  sendJson(res, 201, {
    ok: true,
    data: {
      ...response,
      evaluation,
    },
  });
}

export async function handleGetScores(_req, res, interviewId) {
  const interview = await getInterviewById(interviewId);

  if (!interview) {
    sendJson(res, 404, { ok: false, error: 'Interview not found' });
    return;
  }

  const scores = await getScoresByInterview(interviewId);
  sendJson(res, 200, {
    ok: true,
    data: {
      interviewId,
      overallScore: interview.overallScore,
      responses: scores,
    },
  });
}

