import { Link } from 'react-router-dom';

export default function CampaignCard({ campaign }) {
  const progress = campaign.goal_amount > 0
    ? Math.min(100, ((campaign.current_amount / campaign.goal_amount) * 100)).toFixed(0)
    : 0;

  return (
    <div className="card animate-in" id={`campaign-card-${campaign.id}`} style={{ overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <Link to={`/campaigns/${campaign.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          position: 'relative',
          height: '200px',
          background: campaign.cover_image_url
            ? `url(${campaign.cover_image_url}) center/cover`
            : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
          overflow: 'hidden'
        }}>
          {/* Dark gradient overlay with title */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            padding: '40px 14px 14px'
          }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
              marginBottom: '6px',
              textTransform: 'capitalize'
            }}>
              {campaign.category || 'general'}
            </span>
            <h3 style={{
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
              fontFamily: 'var(--font-display)',
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {campaign.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="card-body" style={{ padding: '14px 16px 16px' }}>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {campaign.description}
        </p>

        <div className="progress-track" style={{ marginBottom: '8px' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '12px' }}>
          <span style={{ color: 'var(--emerald-600)', fontWeight: 700 }}>
            ${Number(campaign.current_amount).toLocaleString()} raised
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {progress}% of ${Number(campaign.goal_amount).toLocaleString()}
          </span>
        </div>

        {campaign.creator_name && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            by {campaign.creator_name}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/campaigns/${campaign.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.88rem' }}>
            View
          </Link>
          <Link to={`/campaigns/${campaign.id}`} className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.88rem' }}>
            Donate
          </Link>
        </div>
      </div>
    </div>
  );
}
