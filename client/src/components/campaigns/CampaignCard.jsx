import { Link } from 'react-router-dom';

export default function CampaignCard({ campaign }) {
  const progress = campaign.goal_amount > 0
    ? Math.min(100, ((campaign.current_amount / campaign.goal_amount) * 100)).toFixed(0)
    : 0;

  return (
    <div className="card animate-in" id={`campaign-card-${campaign.id}`}>
      <div style={{
        height: '200px',
        background: campaign.cover_image_url
          ? `url(${campaign.cover_image_url}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '16px'
      }}>
        <span className="badge badge-accent">{campaign.category || 'general'}</span>
      </div>

      <div className="card-body">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '8px', lineHeight: 1.3 }}>
          <Link to={`/campaigns/${campaign.id}`} style={{ color: 'var(--text-primary)' }}>
            {campaign.title}
          </Link>
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {campaign.description}
        </p>

        <div className="progress-track" style={{ marginBottom: '12px' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            ${Number(campaign.current_amount).toLocaleString()}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {progress}% of ${Number(campaign.goal_amount).toLocaleString()}
          </span>
        </div>

        {campaign.creator_name && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            by {campaign.creator_name}
          </p>
        )}
      </div>
    </div>
  );
}
