import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults } from '../services/interviewService';
import { getScoreColor, getScoreLabel, capitalize } from '../utils/formatters';
import {
  ArrowLeft, Trophy, TrendingUp, TrendingDown, CheckCircle2,
  AlertCircle, BarChart3
} from 'lucide-react';

function ScoreCircle({ score }) {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="score-circle">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle className="score-circle-bg" cx="80" cy="80" r={radius} />
        <circle
          className="score-circle-fill"
          cx="80" cy="80" r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-circle-text">
        <div className="score-circle-value" style={{ color }}>{score}</div>
        <div className="score-circle-label">{getScoreLabel(score)}</div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResults(id)
      .then((data) => setResults(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <p className="text-muted">Generating results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-page" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <AlertCircle size={48} color="var(--warning)" />
        <h2 style={{ marginTop: '16px' }}>Results Not Found</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="results-page animate-fade-in">
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '16px' }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="results-header">
        <h1>
          <Trophy size={32} style={{ verticalAlign: 'middle', color: 'var(--warning)' }} />{' '}
          Interview Results
        </h1>
        <p>{capitalize(results.role || 'software-engineer')} • {capitalize(results.difficulty || 'medium')}</p>
      </div>

      {/* Overview */}
      <div className="results-overview">
        <div className="results-score-panel">
          <ScoreCircle score={results.overallScore} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Overall Score</div>
          </div>
        </div>

        <div className="results-feedback-panel">
          <h3>AI Feedback</h3>
          <p className="results-feedback-text">{results.overallFeedback}</p>

          {results.strengths?.length > 0 && (
            <>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--success)' }}>
                <TrendingUp size={16} /> Strengths
              </h4>
              <div className="results-tags" style={{ marginBottom: '16px' }}>
                {results.strengths.map((s, i) => (
                  <span key={i} className="results-tag results-tag-strength">
                    <CheckCircle2 size={12} /> {s}
                  </span>
                ))}
              </div>
            </>
          )}

          {results.weaknesses?.length > 0 && (
            <>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--warning)' }}>
                <TrendingDown size={16} /> Areas to Improve
              </h4>
              <div className="results-tags">
                {results.weaknesses.map((w, i) => (
                  <span key={i} className="results-tag results-tag-weakness">
                    <AlertCircle size={12} /> {w}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Scores */}
      {results.categoryScores && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={20} /> Category Breakdown
          </h2>
          <div className="results-categories">
            {Object.entries(results.categoryScores).map(([name, score]) => (
              <div key={name} className="category-card">
                <div className="category-card-header">
                  <span className="category-card-name">{capitalize(name)}</span>
                  <span className="category-card-score" style={{ color: getScoreColor(score) }}>
                    {score}%
                  </span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${score}%`,
                      background: getScoreColor(score),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-question */}
      {results.questionResults?.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '16px' }}>Question Details</h2>
          <div className="results-questions">
            {results.questionResults.map((q, i) => (
              <div key={i} className="result-question-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h4>Q{i + 1}: {q.question}</h4>
                  <span
                    className="badge"
                    style={{
                      background: getScoreColor(q.score) + '22',
                      color: getScoreColor(q.score),
                    }}
                  >
                    {q.score}/100
                  </span>
                </div>
                <div className="result-answer">{q.answer}</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {q.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
          Start Another Interview
        </button>
      </div>
    </div>
  );
}
