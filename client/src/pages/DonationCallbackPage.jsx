import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { donationAPI } from '../services/api';

export default function DonationCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [trackingUrl, setTrackingUrl] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    donationAPI.callback(sessionId)
      .then(res => {
        setTrackingUrl(`/track/${sessionId}`);
        setStatus(res.data.data.status === 'success' ? 'success' : 'pending');
      })
      .catch(() => setStatus('error'));
  }, [searchParams]);

  if (status === 'loading') return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page container" style={{ textAlign: 'center' }} id="donation-callback">
      <div className="tracking-card animate-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {status === 'error' ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>We couldn't verify your payment. Please contact support.</p>
            <Link to="/" className="btn btn-primary">Back to Home</Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Thank You!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Your donation {status === 'success' ? 'was successful' : 'is being processed'}!
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
              A receipt and tracking link will be sent to your email.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={trackingUrl} className="btn btn-primary">Track Your Donation</Link>
              <Link to="/explore" className="btn btn-secondary">Explore More Campaigns</Link>
            </div>

            <div className="alert alert-success" style={{ marginTop: '24px', textAlign: 'left' }}>
              💡 <strong>Want to manage all your donations?</strong> Create a free account to track your impact across all campaigns.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
