import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createSession, getSession, updateSession,
  addQuestionToSession, addResponseToSession, getUserSessions,
} from '../services/sessionService.js';
import { generateQuestion, evaluateAnswer, generateFinalResults } from '../services/aiService.js';

const router = Router();
router.use(authMiddleware);

// POST /api/interview/start
router.post('/start', async (req, res) => {
  try {
    const { role, difficulty } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const session = createSession(req.userId, role, difficulty || 'medium');

    // Generate first question
    const questionData = await generateQuestion(role, difficulty || 'medium', [], null);
    const qRecord = addQuestionToSession(session.id, questionData);

    res.json({
      interviewId: session.id,
      firstQuestion: {
        id: qRecord.id,
        text: qRecord.text,
        type: qRecord.type,
        difficulty: qRecord.difficulty,
        isFollowup: qRecord.isFollowup,
        order: qRecord.order,
      },
      totalQuestions: session.totalQuestions,
      timePerQuestion: 120,
    });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// GET /api/interview/:id/next-question
router.get('/:id/next-question', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Interview not found' });

    // If already have an unanswered question at the current index, return it
    const currentQ = session.questions[session.questions.length - 1];
    const answered = session.responses.find((r) => r.questionId === currentQ?.id);

    if (currentQ && !answered) {
      return res.json({
        question: {
          id: currentQ.id,
          text: currentQ.text,
          type: currentQ.type,
          difficulty: currentQ.difficulty,
          isFollowup: currentQ.isFollowup,
          order: currentQ.order,
        },
        progress: { current: session.questions.length, total: session.totalQuestions },
      });
    }

    // Check if interview is done
    if (session.questions.length >= session.totalQuestions) {
      return res.json({ done: true });
    }

    // Get last answer for adaptive questioning
    const lastResponse = session.responses[session.responses.length - 1];
    const lastAnswer = lastResponse?.answerText || null;

    const questionData = await generateQuestion(
      session.role,
      session.difficulty,
      session.questionHistory,
      lastAnswer
    );

    if (!questionData) {
      return res.json({ done: true });
    }

    const qRecord = addQuestionToSession(session.id, questionData);

    res.json({
      question: {
        id: qRecord.id,
        text: qRecord.text,
        type: qRecord.type,
        difficulty: qRecord.difficulty,
        isFollowup: qRecord.isFollowup,
        order: qRecord.order,
      },
      progress: { current: session.questions.length, total: session.totalQuestions },
    });
  } catch (err) {
    console.error('Next question error:', err);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

// POST /api/interview/:id/submit-answer
router.post('/:id/submit-answer', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Interview not found' });

    const { questionId, answerText, timeTaken } = req.body;
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Evaluate answer
    const evaluation = await evaluateAnswer(
      session.role,
      question.text,
      answerText || '(no answer)',
      question.difficulty
    );

    addResponseToSession(session.id, questionId, answerText, timeTaken, evaluation);

    // Check if there are more questions
    const questionsAnswered = session.responses.length;
    const hasMore = questionsAnswered < session.totalQuestions;

    const result = {
      evaluation,
      progress: { current: questionsAnswered, total: session.totalQuestions },
    };

    // Pre-generate next question if there are more
    if (hasMore) {
      const nextQ = await generateQuestion(
        session.role,
        session.difficulty,
        session.questionHistory,
        answerText
      );
      if (nextQ) {
        const qRecord = addQuestionToSession(session.id, nextQ);
        result.nextQuestion = {
          id: qRecord.id,
          text: qRecord.text,
          type: qRecord.type,
          difficulty: qRecord.difficulty,
          isFollowup: qRecord.isFollowup,
          order: qRecord.order,
        };
        result.progress.current = questionsAnswered;
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// POST /api/interview/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Interview not found' });

    // Generate final results
    const questionsAndAnswers = session.questions.map((q) => {
      const response = session.responses.find((r) => r.questionId === q.id);
      return {
        question: q.text,
        answer: response?.answerText || '(skipped)',
        score: response?.evaluation?.score || 0,
      };
    }).filter((qa) => qa.answer !== '(skipped)');

    const finalResults = await generateFinalResults(session.role, session.difficulty, questionsAndAnswers);

    updateSession(session.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      score: finalResults.overallScore,
      results: {
        ...finalResults,
        role: session.role,
        difficulty: session.difficulty,
        questionResults: questionsAndAnswers.map((qa, i) => ({
          question: qa.question,
          answer: qa.answer,
          score: qa.score,
          feedback: session.responses[i]?.evaluation?.feedback || '',
        })),
      },
    });

    res.json({ success: true, redirectTo: `/results/${session.id}` });
  } catch (err) {
    console.error('Complete interview error:', err);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// GET /api/interview/history
router.get('/history', (req, res) => {
  const sessions = getUserSessions(req.userId);
  res.json({
    interviews: sessions.map((s) => ({
      id: s.id,
      role: s.role,
      difficulty: s.difficulty,
      status: s.status,
      score: s.score,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
    })),
  });
});

// GET /api/interview/:id
router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Interview not found' });
  res.json(session);
});

export default router;
