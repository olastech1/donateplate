import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donationAPI } from '../services/api';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

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

  if (loading) return <div className="page flex-center"><div className="spinner" /></div>;
  
  if (error) return (
    <div className="page container flex-center text-center animate-fade">
      <div className="card card-glass" style={{ padding: '60px 40px', maxWidth: '500px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'var(--slate-800)' }}>😕 {error}</h2>
        <p className="text-muted mb-4">Double-check your tracking link and try again.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );

  const { donation, campaign, updates } = data;
  
  const statusConfig = {
    success: { icon: <FiCheckCircle size={32} />, label: 'Successful', color: 'var(--emerald-600)' },
    pending: { icon: <FiClock size={32} />, label: 'Processing', color: 'var(--amber-500)' },
    failed: { icon: <FiXCircle size={32} />, label: 'Failed', color: 'var(--rose-500)' },
  };
  
  const status = statusConfig[donation.status] || statusConfig.pending;

  return (
    <div className="page" style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '600px' }} id="tracking-page">
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fade">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--slate-800)', marginBottom: '8px' }}>Track Your Donation</h1>
          <p className="text-muted">Session: {donation.session_id?.substring(0, 20)}...</p>
        </div>

        <div className="card card-glass animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ color: status.color, marginBottom: '16px' }}>{status.icon}</div>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--slate-800)' }}>Donation {status.label}</h2>
            </div>

            <div className="grid grid-2" style={{ gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div className="text-muted text-sm mb-1">Amount</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--emerald-600)' }}>${Number(donation.amount).toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div className="text-muted text-sm mb-1">Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{new Date(donation.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <div className="flex-between mb-2">
                <span className="text-muted">Campaign</span>
                <Link to={`/campaigns/${campaign.id}`} style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{campaign.title}</Link>
              </div>
              
              <div className="progress-track mt-4 mb-2" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${campaign.progress_percent}%` }} />
              </div>
              <div className="flex-between text-muted text-sm">
                <span>${Number(campaign.current_amount).toLocaleString()} raised</span>
                <span>${Number(campaign.goal_amount).toLocaleString()} goal</span>
              </div>
            </div>
          </div>
        </div>

        {updates && updates.length > 0 && (
          <div className="animate-fade" style={{ animationDelay: '0.2s', marginTop: '40px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'var(--slate-800)' }}>Latest Campaign Updates</h3>
            {updates.map(u => (
              <div key={u.id} className="card card-glass mb-3">
                <div className="card-body">
                  <div className="flex-between mb-2">
                    {u.title && <h4 style={{ margin: 0 }}>{u.title}</h4>}
                    <span className="text-muted text-sm">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{u.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}
