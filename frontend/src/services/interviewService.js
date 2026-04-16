import api from './api';

export async function startInterview(role, difficulty) {
  const { data } = await api.post('/interview/start', { role, difficulty });
  return data;
}

export async function getNextQuestion(interviewId) {
  const { data } = await api.get(`/interview/${interviewId}/next-question`);
  return data;
}

export async function submitAnswer(interviewId, questionId, answerText, timeTaken) {
  const { data } = await api.post(`/interview/${interviewId}/submit-answer`, {
    questionId,
    answerText,
    timeTaken,
  });
  return data;
}

export async function completeInterview(interviewId) {
  const { data } = await api.post(`/interview/${interviewId}/complete`);
  return data;
}

export async function getInterviewHistory() {
  const { data } = await api.get('/interview/history');
  return data;
}

export async function getResults(interviewId) {
  const { data } = await api.get(`/results/${interviewId}`);
  return data;
}

export async function getAnalytics() {
  const { data } = await api.get('/results/analytics');
  return data;
}
