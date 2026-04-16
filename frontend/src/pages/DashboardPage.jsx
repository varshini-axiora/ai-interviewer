import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startInterview, getInterviewHistory } from '../services/interviewService';
import { ROLES, DIFFICULTIES } from '../utils/constants';
import { formatDate, capitalize, getScoreColor } from '../utils/formatters';
import { Play, Clock, Trophy, Target, Briefcase, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [history, setHistory] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    getInterviewHistory()
      .then((data) => setHistory(data.interviews || []))
      .catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!selectedRole) return;
    setStarting(true);
    try {
      const data = await startInterview(selectedRole, selectedDifficulty);
      navigate(`/interview/${data.interviewId}`);
    } catch (err) {
      console.error('Failed to start interview:', err);
    } finally {
      setStarting(false);
    }
  };

  const completedCount = history.filter((h) => h.status === 'completed').length;
  const avgScore = completedCount
    ? Math.round(
        history
          .filter((h) => h.status === 'completed' && h.score != null)
          .reduce((sum, h) => sum + h.score, 0) / completedCount
      )
    : 0;

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'there'} 👋</h1>
        <p>Ready to sharpen your interview skills? Let's begin.</p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value">{history.length}</div>
          <div className="stat-card-label">Total Interviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{completedCount}</div>
          <div className="stat-card-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{avgScore || '—'}</div>
          <div className="stat-card-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {completedCount >= 5 ? '🔥' : completedCount >= 2 ? '⚡' : '🚀'}
          </div>
          <div className="stat-card-label">
            {completedCount >= 5 ? 'On Fire!' : completedCount >= 2 ? 'Getting Started' : 'New Here'}
          </div>
        </div>
      </div>

      {/* Start Interview Panel */}
      <div className="dashboard-section">
        <h2><Play size={20} /> Start New Interview</h2>
        <div className="start-panel">
          <div className="start-panel-left">
            <h3>Choose Your Role</h3>
            <p>Select a position to practice interview questions tailored to that role.</p>
            <div className="role-grid">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className="role-card-icon">{role.icon}</div>
                  <div className="role-card-title">{role.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Difficulty Level</h3>
              <div className="difficulty-selector">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    className={`difficulty-btn ${selectedDifficulty === d.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDifficulty(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={16} />
                <span>~20 minutes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Target size={16} />
                <span>8 adaptive questions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} />
                <span>AI-powered scoring & feedback</span>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleStart}
              disabled={!selectedRole || starting}
            >
              {starting ? <span className="spinner" /> : <>
                <Play size={20} /> Begin Interview
              </>}
            </button>
          </div>
        </div>
      </div>

      {/* Interview History */}
      <div className="dashboard-section">
        <h2><Briefcase size={20} /> Recent Interviews</h2>
        {history.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={64} />
            <p>No interviews yet. Start your first one above!</p>
          </div>
        ) : (
          <div className="history-list">
            {history.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() =>
                  item.status === 'completed'
                    ? navigate(`/results/${item.id}`)
                    : navigate(`/interview/${item.id}`)
                }
              >
                <div className="history-item-left">
                  <div className="history-item-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="history-item-info">
                    <h4>{capitalize(item.role)}</h4>
                    <p>
                      {capitalize(item.difficulty)} • {formatDate(item.createdAt)} •{' '}
                      <span className={`badge badge-${item.status === 'completed' ? 'success' : 'warning'}`}>
                        {item.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.score != null && (
                    <span
                      className="history-item-score"
                      style={{ color: getScoreColor(item.score) }}
                    >
                      {item.score}%
                    </span>
                  )}
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
