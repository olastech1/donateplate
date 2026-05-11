import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import GuestCheckoutForm from '../components/donations/GuestCheckoutForm';
import { campaignAPI, updateAPI } from '../services/api';

export default function CampaignPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [donors, setDonors] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('story');

  useEffect(() => {
    Promise.all([
      campaignAPI.getById(id),
      campaignAPI.getDonors(id),
      updateAPI.list(id)
    ]).then(([campRes, donorRes, updRes]) => {
      setCampaign(campRes.data.data);
      setDonors(donorRes.data.data);
      setUpdates(updRes.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!campaign) return <div className="page container"><h2>Campaign not found</h2></div>;

  const progress = campaign.goal_amount > 0
    ? Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100).toFixed(1)
    : 0;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / 3600000);
    return hours > 0 ? `${hours}h ago` : 'Just now';
  };

  return (
    <div className="campaign-detail">
      <div className="container">
        {campaign.cover_image_url && (
          <img src={campaign.cover_image_url} alt={campaign.title} className="campaign-hero-img" />
        )}

        <div className="campaign-layout">
          {/* Left: Content */}
          <div>
            <div className="campaign-meta">
              <span className="badge badge-accent">{campaign.category}</span>
              <span className="badge badge-success">{campaign.status}</span>
            </div>

            <h1 className="campaign-title">{campaign.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              by {campaign.creator_name} · Created {timeAgo(campaign.created_at)}
            </p>

            {/* Progress */}
            <div className="progress-track" style={{ height: '12px', marginBottom: '8px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="campaign-stats-row">
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>
                ${Number(campaign.current_amount).toLocaleString()}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                raised of ${Number(campaign.goal_amount).toLocaleString()} goal ({progress}%)
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', margin: '32px 0 24px', borderBottom: '1px solid var(--border)' }}>
              {['story', 'updates', 'donors'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s'
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'donors' ? `(${campaign.donor_count || 0})` : t === 'updates' ? `(${updates.length})` : ''}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tab === 'story' && (
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {campaign.description}
              </div>
            )}

            {tab === 'updates' && (
              updates.length > 0 ? updates.map(u => (
                <div key={u.id} className="card" style={{ marginBottom: '16px' }}>
                  <div className="card-body">
                    {u.title && <h4 style={{ marginBottom: '6px' }}>{u.title}</h4>}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.message}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>{timeAgo(u.created_at)}</p>
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)' }}>No updates yet.</p>
            )}

            {tab === 'donors' && (
              donors.length > 0 ? donors.map(d => (
                <div key={d.id} className="donor-item">
                  <div>
                    <div className="donor-name">{d.donor_name || 'Anonymous'}</div>
                    <div className="donor-time">{timeAgo(d.created_at)}</div>
                  </div>
                  <div className="donor-amount">${Number(d.amount).toLocaleString()}</div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)' }}>Be the first to donate!</p>
            )}
          </div>

          {/* Right: Sticky Donation Box */}
          <GuestCheckoutForm campaignId={campaign.id} campaignTitle={campaign.title} />
        </div>
      </div>
    </div>
  );
}
