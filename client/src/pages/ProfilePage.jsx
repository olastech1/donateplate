import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMapPin, FiLink, FiCalendar, FiHeart, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { userAPI } from '../services/api';
import CampaignCard from '../components/campaign/CampaignCard';

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAPI.getPublicProfile(id);
        if (res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        setError('Failed to load profile. This user may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="page flex-center"><div className="spinner"></div></div>;
  }

  if (error || !profile) {
    return (
      <div className="page container text-center pt-6">
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-900)' }}>Profile Not Found</h2>
        <p className="text-muted mt-2">{error}</p>
        <Link to="/explore" className="btn btn-primary mt-4">Explore Campaigns</Link>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="page">
      <div className="container">
        
        {/* Profile Header */}
        <div className="profile-header animate-in">
          {/* Decorative background elements inside header */}
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--coral-500) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(40px)', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', bottom: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--teal-400) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(40px)', zIndex: 0 }}></div>
          
          <div className="profile-avatar flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-info flex-1">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, marginBottom: '12px' }}>{profile.name}</h1>
            
            {profile.bio && <p className="profile-bio" style={{ fontSize: '1.1rem', color: 'var(--slate-200)', maxWidth: '700px', lineHeight: 1.6, marginBottom: '24px' }}>{profile.bio}</p>}
            
            <div className="profile-meta flex flex-wrap" style={{ gap: '24px', alignItems: 'center' }}>
              <div className="badge badge-success" style={{ background: 'rgba(20,184,166,0.2)', border: '1px solid var(--teal-500)' }}>
                <FiCheckCircle style={{ marginRight: '4px' }} /> Verified Member
              </div>
              
              {profile.location && (
                <div className="flex items-center gap-1" style={{ color: 'var(--slate-300)' }}>
                  <FiMapPin /> {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1" style={{ color: 'var(--slate-300)' }}>
                  <FiLink /> <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Website</a>
                </div>
              )}
              <div className="flex items-center gap-1" style={{ color: 'var(--slate-300)' }}>
                <FiCalendar /> Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats animate-in" style={{ animationDelay: '0.1s', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
          <div className="profile-stat-card card-glass card-hover">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--coral-50)', color: 'var(--coral-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiHeart size={24} />
            </div>
            <div className="profile-stat-value">{formatCurrency(profile.total_donated)}</div>
            <div className="profile-stat-label">Total Impact</div>
          </div>
          <div className="profile-stat-card card-glass card-hover">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--teal-50)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiTrendingUp size={24} />
            </div>
            <div className="profile-stat-value">{profile.total_campaigns_supported}</div>
            <div className="profile-stat-label">Causes Supported</div>
          </div>
          <div className="profile-stat-card card-glass card-hover">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--amber-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem' }}>
              🍽️
            </div>
            <div className="profile-stat-value">{profile.campaigns.length}</div>
            <div className="profile-stat-label">Campaigns Created</div>
          </div>
        </div>

        {/* User's Campaigns */}
        <div className="animate-in" style={{ animationDelay: '0.2s', marginTop: '60px' }}>
          <div className="flex-between mb-4">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--slate-900)' }}>
              Campaigns by {profile.name}
            </h3>
          </div>
          
          {profile.campaigns.length > 0 ? (
            <div className="grid grid-3">
              {profile.campaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="card text-center" style={{ padding: '60px 24px', background: 'var(--bg-card)' }}>
              <p className="text-muted" style={{ fontSize: '1.1rem' }}>This user hasn't created any active campaigns yet.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
