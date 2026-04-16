import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestOtp, verifyOtp, login } from '../services/authService';
import { Mail, KeyRound, Lock, BrainCircuit, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  
  // States specific to OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  
  // State specific to password logic
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // ----- OTP Logic -----
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const resp = await requestOtp(email);
      setMessage(resp.message || 'OTP sent successfully!');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      loginUser(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ----- Password Logic -----
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await login(email, password);
      loginUser(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setError('');
    setMessage('');
    setStep('request');
    setOtp('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <BrainCircuit size={48} color="var(--accent-primary)" />
          </div>
          <h1>Welcome Back</h1>
          <p>
            {loginMethod === 'otp'
              ? step === 'request'
                ? 'Enter your email to receive a One-Time Password (OTP)'
                : `We've sent a 6-digit code to ${email}`
              : 'Sign in with your email and password'}
          </p>
        </div>

        <div className="auth-card">
          {/* OTP Login Flow (Step 1: Request OTP) */}
          {loginMethod === 'otp' && step === 'request' && (
            <form className="auth-form" onSubmit={handleRequestOtp}>
              {error && <div className="auth-error">{error}</div>}
              {message && <div style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</div>}

              <div className="input-group">
                <label htmlFor="login-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    type="email"
                    className="input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send OTP Code'}
              </button>
            </form>
          )}

          {/* OTP Login Flow (Step 2: Verify OTP) */}
          {loginMethod === 'otp' && step === 'verify' && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              {error && <div className="auth-error">{error}</div>}

              <div className="input-group">
                <label htmlFor="login-otp">One-Time Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                     id="login-otp"
                     type="text"
                     className="input"
                     style={{ paddingLeft: '40px', letterSpacing: '2px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
                     placeholder="123456"
                     maxLength={6}
                     value={otp}
                     onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                     required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || otp.length < 6}>
                {loading ? <span className="spinner" /> : 'Verify & Log In'}
              </button>

              <button 
                type="button" 
                className="btn btn-ghost btn-full" 
                onClick={resetFlow} 
                style={{ marginTop: '8px' }}
              >
                <ArrowLeft size={16} /> Back to email
              </button>
            </form>
          )}

          {/* Password Login Flow */}
          {loginMethod === 'password' && (
            <form className="auth-form" onSubmit={handlePasswordLogin}>
              {error && <div className="auth-error">{error}</div>}

              <div className="input-group">
                <label htmlFor="login-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    type="email"
                    className="input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

               <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-password"
                    type="password"
                    className="input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* Authentication Toggles */}
          {step === 'request' && (
            <>
              <div className="auth-divider">OR</div>
              
              <button 
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp');
                  resetFlow();
                }}
              >
                {loginMethod === 'otp' ? 'Log in with Password' : 'Log in with OTP Code'}
              </button>

              <div className="auth-footer" style={{ marginTop: '24px' }}>
                Don't have an account? <Link to="/signup">Sign up</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
