import { z } from 'zod';
import { readJsonBody, sendJson } from '../../common/http.js';
import { createInterview, getInterviewById, markInterviewCompleted } from './repository.js';

const createInterviewSchema = z.object({
  candidateUserId: z.string().min(1),
  domainId: z.string().uuid(),
});

export async function handleCreateInterview(req, res) {
  const body = await readJsonBody(req);
  const parsed = createInterviewSchema.safeParse(body);

  if (!parsed.success) {
    sendJson(res, 400, { ok: false, error: parsed.error.flatten() });
    return;
  }

  const interview = await createInterview(parsed.data);
  sendJson(res, 201, { ok: true, data: interview });
}

export async function handleGetInterview(_req, res, interviewId) {
  const interview = await getInterviewById(interviewId);

  if (!interview) {
    sendJson(res, 404, { ok: false, error: 'Interview not found' });
    return;
  }

  sendJson(res, 200, { ok: true, data: interview });
}

export async function handleCompleteInterview(_req, res, interviewId) {
  const interview = await markInterviewCompleted(interviewId);

  if (!interview) {
    sendJson(res, 404, { ok: false, error: 'Interview not found' });
    return;
  }

  sendJson(res, 200, { ok: true, data: interview });
}

