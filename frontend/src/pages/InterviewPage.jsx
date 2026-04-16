import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNextQuestion, submitAnswer, completeInterview } from '../services/interviewService';
import { useTimer } from '../hooks/useTimer';
import { TIME_PER_QUESTION } from '../utils/constants';
import { formatTime, capitalize } from '../utils/formatters';
import {
  Clock, Send, Mic, MicOff, SkipForward, AlertTriangle,
  CheckCircle2, ChevronRight, XCircle
} from 'lucide-react';

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [progress, setProgress] = useState({ current: 1, total: 8 });
  const [submitting, setSubmitting] = useState(false);
  const [loadingQ, setLoadingQ] = useState(true);
  const [interviewDone, setInterviewDone] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cheatingWarnings, setCheatingWarnings] = useState([]);

  const answerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Timer
  const handleExpire = useCallback(() => {
    if (question && answer.trim()) {
      handleSubmit();
    }
  }, [question, answer]);

  const { seconds, elapsed, isRunning, start, reset } = useTimer(TIME_PER_QUESTION, handleExpire);

  // Load first question
  useEffect(() => {
    loadQuestion();
  }, []);

  // Cheating: tab switch detection
  useEffect(() => {
    const handleVis = () => {
      if (document.hidden) {
        setCheatingWarnings((prev) => [
          ...prev,
          { type: 'tab_switch', time: new Date().toISOString() },
        ]);
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // Block paste
  useEffect(() => {
    const handlePaste = (e) => {
      e.preventDefault();
      setCheatingWarnings((prev) => [
        ...prev,
        { type: 'paste_attempt', time: new Date().toISOString() },
      ]);
    };
    const el = answerRef.current;
    if (el) el.addEventListener('paste', handlePaste);
    return () => el?.removeEventListener('paste', handlePaste);
  }, [question]);

  const loadQuestion = async () => {
    setLoadingQ(true);
    setEvaluation(null);
    setAnswer('');
    try {
      const data = await getNextQuestion(id);
      if (data.done) {
        setInterviewDone(true);
        return;
      }
      setQuestion(data.question);
      setProgress(data.progress || progress);
      reset(TIME_PER_QUESTION);
      start();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQ(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);

    try {
      const data = await submitAnswer(id, question.id, answer, elapsed);
      setEvaluation(data.evaluation);
      if (data.progress) setProgress(data.progress);
      reset(TIME_PER_QUESTION);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (progress.current >= progress.total) {
      handleComplete();
    } else {
      loadQuestion();
    }
  };

  const handleComplete = async () => {
    try {
      await completeInterview(id);
      navigate(`/results/${id}`);
    } catch (err) {
      navigate(`/results/${id}`);
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const timerClass = seconds <= 15 ? 'timer-danger' : seconds <= 30 ? 'timer-warning' : '';

  if (interviewDone) {
    return (
      <div className="interview-page animate-fade-in" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <CheckCircle2 size={64} color="var(--success)" />
        <h2 style={{ marginTop: '16px', fontSize: '2rem' }}>Interview Complete!</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 32px' }}>
          Your responses have been evaluated. Let's see how you did.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate(`/results/${id}`)}>
          View Results <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  if (loadingQ) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <p className="text-muted">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="interview-page animate-fade-in">
      {/* Cheating Alerts */}
      {cheatingWarnings.length > 0 && (
        <div className="cheating-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <AlertTriangle size={16} /> Warning
          </div>
          Tab switches detected: {cheatingWarnings.filter((w) => w.type === 'tab_switch').length}
          {cheatingWarnings.some((w) => w.type === 'paste_attempt') && (
            <div style={{ marginTop: '4px' }}>Paste attempts blocked</div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="interview-header">
        <div className="interview-progress">
          <span className="interview-progress-text">
            Question {progress.current} / {progress.total}
          </span>
          <div className="progress-bar-container" style={{ flex: 1 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
        <div className={`timer ${timerClass}`}>
          <Clock size={18} />
          {formatTime(seconds)}
        </div>
      </div>

      {/* Question */}
      <div className="question-card">
        <div className="question-number">
          {question?.isFollowup ? '↳ Follow-up Question' : `Question ${progress.current}`}
        </div>
        <div className="question-text">{question?.text}</div>
        <div className="question-meta">
          <span className="badge badge-primary">{question?.type || 'technical'}</span>
          <span className="badge badge-warning">{question?.difficulty || 'medium'}</span>
        </div>
      </div>

      {/* Answer */}
      {!evaluation && (
        <div className="answer-section">
          <div className="answer-header">
            <label>Your Answer</label>
            <button
              type="button"
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoice}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
              style={{ width: '40px', height: '40px' }}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <textarea
            ref={answerRef}
            className="input textarea"
            placeholder="Type your answer here... (paste is disabled)"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
          />
          <div className="answer-actions">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {answer.length} characters
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleNext}>
                <SkipForward size={16} /> Skip
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting}
              >
                {submitting ? <span className="spinner" /> : <>
                  <Send size={16} /> Submit Answer
                </>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation */}
      {evaluation && (
        <div className="interview-evaluation">
          <div className="evaluation-header">
            <CheckCircle2 size={20} />
            AI Evaluation
          </div>
          <div className="evaluation-scores">
            <div className="eval-score">
              <div className="eval-score-value" style={{ color: 'var(--accent-primary-hover)' }}>
                {evaluation.score}
              </div>
              <div className="eval-score-label">Score</div>
            </div>
            <div className="eval-score">
              <div className="eval-score-value" style={{ color: 'var(--success)' }}>
                {Math.round((evaluation.relevance || 0.8) * 100)}%
              </div>
              <div className="eval-score-label">Relevance</div>
            </div>
            <div className="eval-score">
              <div className="eval-score-value" style={{ color: 'var(--warning)' }}>
                {Math.round((evaluation.correctness || 0.75) * 100)}%
              </div>
              <div className="eval-score-label">Correctness</div>
            </div>
          </div>
          <div className="evaluation-feedback">{evaluation.feedback}</div>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button className="btn btn-primary" onClick={handleNext}>
              {progress.current >= progress.total ? (
                <>Finish Interview <CheckCircle2 size={16} /></>
              ) : (
                <>Next Question <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
