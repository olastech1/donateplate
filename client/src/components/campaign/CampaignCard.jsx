import { Link } from 'react-router-dom';
import { FiClock, FiTarget } from 'react-icons/fi';

export default function CampaignCard({ campaign }) {
  const progress = Math.min((Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100, 100);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const getDaysLeft = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Link to={`/campaigns/${campaign.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
        <img 
          src={campaign.cover_image_url || 'https://images.unsplash.com/photo-1593113565630-1de62d64020b?auto=format&fit=crop&w=600&q=80'} 
          alt={campaign.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--transition-spring)' }}
          className="campaign-card-img"
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
          <span className="badge badge-category">{campaign.category}</span>
          {progress >= 100 && <span className="badge badge-success">Funded</span>}
        </div>
      </div>
      
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          marginBottom: '8px',
          color: 'var(--slate-800)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {campaign.title}
        </h3>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.9rem', 
          marginBottom: '20px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {campaign.description}
        </p>
        
        <div style={{ marginBottom: '16px' }}>
          <div className="progress-track" style={{ height: '8px', marginBottom: '8px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex-between" style={{ fontSize: '0.9rem' }}>
            <div>
              <strong style={{ color: 'var(--teal-600)', fontSize: '1.1rem' }}>{formatCurrency(campaign.current_amount)}</strong>
              <span className="text-muted"> raised</span>
            </div>
            <div className="text-muted text-right">
              {progress.toFixed(0)}%
            </div>
          </div>
        </div>
        
        <div className="flex-between" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiTarget /> {formatCurrency(campaign.goal_amount)} Goal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiClock /> {getDaysLeft(campaign.end_date)} days left
          </div>
        </div>
      </div>
      
      <style>{`
        .card:hover .campaign-card-img {
          transform: scale(1.05);
        }
      `}</style>
    </Link>
  );
}
