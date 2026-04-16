import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getSession, getUserSessions } from '../services/sessionService.js';

const router = Router();
router.use(authMiddleware);

// GET /api/results/:interviewId
router.get('/:interviewId', (req, res) => {
  const session = getSession(req.params.interviewId);
  if (!session) return res.status(404).json({ error: 'Interview not found' });
  if (!session.results) return res.status(404).json({ error: 'Results not yet available' });

  res.json(session.results);
});

// GET /api/results/analytics
router.get('/analytics/summary', (req, res) => {
  const sessions = getUserSessions(req.userId);
  const completed = sessions.filter((s) => s.status === 'completed' && s.score != null);

  if (completed.length === 0) {
    return res.json({
      totalInterviews: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuestions: 0,
      scoresByRole: [],
      scoresByCategory: [],
      recentScores: [],
    });
  }

  const scores = completed.map((s) => s.score);
  const totalQuestions = completed.reduce((sum, s) => sum + s.responses.length, 0);

  // Group by role
  const roleMap = {};
  completed.forEach((s) => {
    if (!roleMap[s.role]) roleMap[s.role] = [];
    roleMap[s.role].push(s.score);
  });
  const scoresByRole = Object.entries(roleMap).map(([role, scores]) => ({
    role,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // Aggregate category scores
  const catMap = {};
  completed.forEach((s) => {
    if (s.results?.categoryScores) {
      Object.entries(s.results.categoryScores).forEach(([cat, score]) => {
        if (!catMap[cat]) catMap[cat] = [];
        catMap[cat].push(score);
      });
    }
  });
  const scoresByCategory = Object.entries(catMap).map(([category, scores]) => ({
    category,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  res.json({
    totalInterviews: completed.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
    totalQuestions,
    scoresByRole,
    scoresByCategory,
    recentScores: completed.slice(0, 10).map((s) => ({ score: s.score, date: s.completedAt })),
  });
});

export default router;
