import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { userAPI } from '../services/api';

export default function KycCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setMessage('Session ID is missing in callback URL.');
      return;
    }

    userAPI.syncStripeKycSession(sessionId)
      .then(res => {
        if (res.data.status === 'verified') {
          setStatus('success');
        } else if (res.data.status === 'rejected') {
          setStatus('failed');
          setMessage(res.data.message);
        } else {
          setStatus('pending');
          setMessage(res.data.message);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify identity with Stripe.');
      });
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Verifying your identity session with Stripe...</p>
      </div>
    );
  }

  return (
    <div className="page container" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="card animate-in" style={{ maxWidth: '500px', width: '100%', padding: '32px 24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🛡️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)', marginBottom: '12px' }}>Identity Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
              Thank you! Your identity has been successfully verified via Stripe Identity. You are now cleared to launch campaigns and withdraw raised funds.
            </p>
            <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)', marginBottom: '12px' }}>Verification Processing</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {message || 'Stripe is currently reviewing your documents. This process usually completes in a few minutes.'}
            </p>
            <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)', marginBottom: '12px' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {message || 'The verification attempt could not be completed successfully. Please ensure your ID document photos are clear and legible.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
                Dashboard
              </Link>
              <Link to="/dashboard" onClick={() => window.location.reload()} className="btn btn-primary" style={{ flex: 1 }}>
                Try Again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
