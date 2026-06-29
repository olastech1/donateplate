import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiCheckCircle, FiInbox } from 'react-icons/fi';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification(email);
      setResent(true);
    } catch {
      // silent — always shows success per security design
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  // ── "Check your email" screen ──────────────────────────────
  if (registered) {
    return (
      <div className="auth-split">
        <div className="auth-left" style={{ background: 'var(--gradient-cool)' }}>
          <div>
            <Link to="/" className="navbar-logo" style={{ color: '#fff' }}>
              <span style={{ background: '#fff', color: 'var(--teal-600)', padding: '4px 8px', borderRadius: '8px' }}>DP</span>
              DonateFate
            </Link>
          </div>
          <div style={{ maxWidth: '440px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '24px' }}>Almost there!</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
              We need to verify your email address to ensure the security of our platform and community.
            </p>
          </div>
          <div></div>
        </div>
        
        <div className="auth-right">
          <div className="auth-form-container animate-fade text-center">
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,211,238,0.1)', color: 'var(--teal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 24px' }}>
              <FiInbox />
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Check your inbox</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1.1rem' }}>
              We sent a verification link to:
            </p>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '32px', wordBreak: 'break-all', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              {email}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: 1.6 }}>
              Click the link in the email to activate your account.<br/>The link expires in 24 hours.
            </p>

            {resent ? (
              <div className="alert alert-success flex-center mb-4">
                <FiCheckCircle size={20} /> A new verification email has been sent!
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-block btn-lg"
                onClick={handleResend}
                disabled={resending}
                style={{ marginBottom: '24px' }}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}

            <p style={{ color: 'var(--text-muted)' }}>
              Already verified? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────
  return (
    <div className="auth-split">
      <div className="auth-left" style={{ background: 'var(--gradient-sunset)' }}>
        <div>
          <Link to="/" className="navbar-logo" style={{ color: '#fff' }}>
            <span style={{ background: '#fff', color: 'var(--coral-600)', padding: '4px 8px', borderRadius: '8px' }}>DP</span>
            DonateFate
          </Link>
        </div>
        <div style={{ maxWidth: '440px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '24px' }}>Start your journey today.</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
            Create an account to launch campaigns, track donations, and join a community dedicated to serving generosity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid var(--accent)', marginLeft: i > 1 ? '-12px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiHeart size={16} />
              </div>
            ))}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Make a difference</span>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-form-container animate-fade">
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Create an Account</h2>
            <p className="text-secondary">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="alert alert-error mb-4" style={{ alignItems: 'center' }}>
              <FiAlertCircle size={20} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
              <div className="form-hint mt-2 text-muted">Must be at least 6 characters long.</div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Get Started'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--slate-500)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
