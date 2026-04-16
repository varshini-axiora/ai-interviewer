import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/interviewService';
import { getScoreColor, capitalize } from '../utils/formatters';
import { BarChart3, TrendingUp, Award, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="analytics-page animate-fade-in">
      <h1><BarChart3 size={28} style={{ verticalAlign: 'middle' }} /> Analytics</h1>

      {/* Summary Stats */}
      <div className="dashboard-stats" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-card-value">{analytics.totalInterviews}</div>
          <div className="stat-card-label">Total Interviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{analytics.averageScore}%</div>
          <div className="stat-card-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{analytics.bestScore}%</div>
          <div className="stat-card-label">Best Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{analytics.totalQuestions}</div>
          <div className="stat-card-label">Questions Answered</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Scores by Role */}
        <div className="analytics-chart">
          <h3><Award size={18} style={{ verticalAlign: 'middle' }} /> Score by Role</h3>
          <div className="bar-chart">
            {(analytics.scoresByRole || []).map((item) => (
              <div key={item.role} className="bar-item">
                <span className="bar-label">{capitalize(item.role)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${item.score}%` }}>
                    {item.score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scores by Category */}
        <div className="analytics-chart">
          <h3><TrendingUp size={18} style={{ verticalAlign: 'middle' }} /> Score by Category</h3>
          <div className="bar-chart">
            {(analytics.scoresByCategory || []).map((item) => (
              <div key={item.category} className="bar-item">
                <span className="bar-label">{capitalize(item.category)}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${item.score}%`,
                      background: `linear-gradient(135deg, ${getScoreColor(item.score)}, ${getScoreColor(item.score)}88)`,
                    }}
                  >
                    {item.score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trend */}
        <div className="analytics-chart" style={{ gridColumn: '1 / -1' }}>
          <h3><Clock size={18} style={{ verticalAlign: 'middle' }} /> Recent Performance</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '200px', paddingTop: '20px' }}>
            {(analytics.recentScores || []).map((item, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getScoreColor(item.score) }}>
                  {item.score}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${item.score * 1.6}px`,
                    background: `linear-gradient(to top, ${getScoreColor(item.score)}, ${getScoreColor(item.score)}55)`,
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 1s ease',
                  }}
                />
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
