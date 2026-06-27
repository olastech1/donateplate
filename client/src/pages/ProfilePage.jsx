import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMapPin, FiLink, FiCalendar, FiHeart, FiTrendingUp } from 'react-icons/fi';
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
      <div className="page container text-center">
        <h2>Profile Not Found</h2>
        <p className="text-muted mt-2">{error}</p>
        <Link to="/explore" className="btn btn-primary mt-4">Explore Campaigns</Link>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="page" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header animate-fade">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h1>{profile.name}</h1>
            
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            
            <div className="profile-meta">
              {profile.location && (
                <div className="profile-meta-item">
                  <FiMapPin /> {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="profile-meta-item">
                  <FiLink /> <a href={profile.website} target="_blank" rel="noopener noreferrer">Website</a>
                </div>
              )}
              <div className="profile-meta-item">
                <FiCalendar /> Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className="profile-stat-card">
            <FiHeart size={24} color="var(--coral-500)" className="mb-2" />
            <div className="profile-stat-value">{formatCurrency(profile.total_donated)}</div>
            <div className="profile-stat-label">Total Donated</div>
          </div>
          <div className="profile-stat-card">
            <FiTrendingUp size={24} color="var(--teal-500)" className="mb-2" />
            <div className="profile-stat-value">{profile.total_campaigns_supported}</div>
            <div className="profile-stat-label">Campaigns Supported</div>
          </div>
          <div className="profile-stat-card">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍽️</div>
            <div className="profile-stat-value">{profile.campaigns.length}</div>
            <div className="profile-stat-label">Campaigns Created</div>
          </div>
        </div>

        {/* User's Campaigns */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '24px' }}>
          Campaigns by {profile.name}
        </h3>
        
        {profile.campaigns.length > 0 ? (
          <div className="grid grid-3 animate-fade" style={{ animationDelay: '0.2s' }}>
            {profile.campaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '40px' }}>
            <p className="text-muted">This user hasn't created any active campaigns yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
