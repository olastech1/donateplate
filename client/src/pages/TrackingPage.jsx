import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donationAPI } from '../services/api';

export default function TrackingPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    donationAPI.track(sessionId)
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Donation not found.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (error) return (
    <div className="page container" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '16px' }}>😕 {error}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Double-check your tracking link and try again.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );

  const { donation, campaign, updates } = data;
  const statusConfig = {
    success: { icon: '✅', label: 'Successful', bg: 'var(--success-bg)', color: 'var(--success)' },
    pending: { icon: '⏳', label: 'Processing', bg: 'var(--warning-bg)', color: 'var(--warning)' },
    failed: { icon: '❌', label: 'Failed', bg: 'var(--danger-bg)', color: 'var(--danger)' },
  };
  const status = statusConfig[donation.status] || statusConfig.pending;

  return (
    <div className="page container" id="tracking-page">
      <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-in">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Track Your Donation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Session: {donation.session_id?.substring(0, 20)}...</p>
      </div>

      <div className="tracking-card animate-in">
        <div className="tracking-status">
          <div className="tracking-status-icon" style={{ background: status.bg, color: status.color }}>{status.icon}</div>
          <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>Donation {status.label}</h2>
        </div>

        <div className="tracking-detail-row">
          <span className="tracking-label">Amount</span>
          <span className="tracking-value" style={{ color: 'var(--accent)' }}>${Number(donation.amount).toLocaleString()}</span>
        </div>
        <div className="tracking-detail-row">
          <span className="tracking-label">Date</span>
          <span className="tracking-value">{new Date(donation.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
        </div>
        <div className="tracking-detail-row">
          <span className="tracking-label">Campaign</span>
          <span className="tracking-value">{campaign.title}</span>
        </div>
        <div className="tracking-detail-row">
          <span className="tracking-label">Progress</span>
          <span className="tracking-value">{campaign.progress_percent}%</span>
        </div>

        <div style={{ margin: '20px 0' }}>
          <div className="progress-track" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: `${campaign.progress_percent}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>${Number(campaign.current_amount).toLocaleString()}</span>
            <span>${Number(campaign.goal_amount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {updates && updates.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '40px auto 0' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Campaign Updates</h3>
          {updates.map(u => (
            <div key={u.id} className="card" style={{ marginBottom: '12px' }}>
              <div className="card-body">
                {u.title && <h4 style={{ marginBottom: '4px' }}>{u.title}</h4>}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.message}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
                  {new Date(u.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
