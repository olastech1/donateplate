import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // email-not-verified state
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setResent(false);
    setLoading(true);
    try {
      const result = await login(email, password);
      const role = result?.data?.user?.role;
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email || email);
      } else {
        setError(data?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification(unverifiedEmail);
    } catch {
      // silent
    } finally {
      setResending(false);
      setResent(true);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div>
          <Link to="/" className="navbar-logo" style={{ color: '#fff' }}>
            <span style={{ background: '#fff', color: 'var(--accent)', padding: '4px 8px', borderRadius: '8px' }}>DP</span>
            DonateFate
          </Link>
        </div>
        <div style={{ maxWidth: '440px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '24px' }}>Welcome back to the community.</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
            Log in to manage your campaigns, track your impact, and continue serving generosity to those in need.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid var(--accent)', marginLeft: i > 1 ? '-12px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCheckCircle size={16} />
              </div>
            ))}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Join 10k+ active donors</span>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-form-container animate-fade">
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--slate-900)', marginBottom: '8px' }}>Sign in to your account</h2>
            <p className="text-secondary">Enter your details to access your dashboard</p>
          </div>

          {error && (
            <div className="alert alert-error mb-4" style={{ alignItems: 'center' }}>
              <FiAlertCircle size={20} />
              <div>{error}</div>
            </div>
          )}

          {unverifiedEmail && (
            <div className="alert alert-warning mb-4" style={{ flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600 }}>
                <FiMail size={20} /> Email not verified
              </div>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Check your inbox at <strong>{unverifiedEmail}</strong> for the verification link.
              </p>
              {resent ? (
                <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <FiCheckCircle /> Verification email resent!
                </div>
              ) : (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ alignSelf: 'flex-start', background: '#fff' }}
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="name@example.com"
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--slate-500)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
