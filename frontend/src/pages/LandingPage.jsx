import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, PlayCircle, BarChart3, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page animate-fade-in">
      {/* Navbar specific to landing page */}
      <nav className="navbar" style={{ position: 'relative', background: 'transparent', borderBottom: 'none' }}>
        <div className="navbar-brand">
          <BrainCircuit size={28} />
          AI Interviewer
        </div>
        <div className="navbar-nav">
          <Link to="/login" className="btn btn-ghost">Log In</Link>
          <Link to="/login" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px', padding: '64px 24px' }}>
          <h1 className="hero-title">Master Your Next Tech Interview</h1>
          <p className="hero-subtitle">
            Practice technical, behavioral, and situational interviews with an advanced AI. 
            Get instant scoring, detailed feedback, and identify areas to improve before the real thing.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Start Practicing Free <ChevronRight size={20} />
            </button>
          </div>
          <div style={{ marginTop: '48px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <p>Trusted by candidates landing offers at top tech companies</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" style={{ background: 'var(--bg-card)', padding: '64px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Everything You Need to Succeed</h2>
          </div>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon"><BrainCircuit size={24} /></div>
              <h3>Adaptive Questioning</h3>
              <p>Our AI dynamically adjusts question difficulty and asks realistic follow-ups based on your previous answers.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon"><CheckCircle2 size={24} /></div>
              <h3>Instant AI Evaluation</h3>
              <p>Receive immediate, actionable feedback on correctness, relevance, and confidence for every response.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon"><BarChart3 size={24} /></div>
              <h3>Comprehensive Analytics</h3>
              <p>Track your progress across multiple roles and categories to measure improvement over time.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><PlayCircle size={24} /></div>
              <h3>Multiple Tech Roles</h3>
              <p>Tailored interview banks for Software Engineering, Product Management, Data Analysis, and DevOps.</p>
            </div>

             <div className="feature-card">
              <div className="feature-icon" style={{color: 'var(--warning)'}}><ShieldCheck size={24} color="var(--success)" /></div>
              <h3>Proctoring Capabilities</h3>
              <p>Enterprise-grade cheat detection to simulate real remote-interview environments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="navbar-brand" style={{ justifyContent: 'center', marginBottom: '16px' }}>
          <BrainCircuit size={24} />
          AI Interviewer
        </div>
        <p>&copy; {new Date().getFullYear()} AI Interviewer Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
