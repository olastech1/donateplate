import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiTrendingUp, FiShield, FiSearch, FiActivity, FiUsers, FiGlobe, FiCheckCircle } from 'react-icons/fi';
import { campaignAPI } from '../services/api';
import CampaignCard from '../components/campaign/CampaignCard';

export default function Home() {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [stats, setStats] = useState({ total_donated: 0, total_campaigns: 0, total_donors: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, statsRes] = await Promise.all([
          campaignAPI.list({ limit: 3 }),
          campaignAPI.getStats()
        ]);
        if (campaignsRes.data.success) {
          setFeaturedCampaigns(campaignsRes.data.data || []);
        }
        if (statsRes.data.success) {
          const d = statsRes.data.data;
          setStats({
            total_donated: Number(d.donations?.total_raised || 0),
            total_campaigns: Number(d.campaigns?.active || 0),
            total_donors: Number(d.donations?.unique_donors || 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="home-page animate-fade">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="badge badge-accent mb-3 animate-in" style={{ animationDelay: '0.1s' }}>
            New Release v3.0
          </div>
          <h1 className="animate-in" style={{ animationDelay: '0.2s' }}>
            Empower communities with <br />
            <span className="gradient-text">every plate shared.</span>
          </h1>
          <p className="hero-subtitle animate-in" style={{ animationDelay: '0.3s' }}>
            DonatePlate is a vibrant crowdfunding platform built on transparency. 
            Discover verified campaigns, set up recurring donations, and track exactly how your generosity creates impact.
          </p>
          <div className="hero-actions animate-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/explore" className="btn btn-xl btn-primary">
              <FiSearch size={20} /> Explore Campaigns
            </Link>
            <Link to="/campaigns/create" className="btn btn-xl btn-secondary">
              Start a Campaign
            </Link>
          </div>

          <div className="stats-bar animate-in" style={{ animationDelay: '0.6s' }}>
            <div className="stat-item">
              <div className="stat-value">{formatCurrency(stats.total_donated)}</div>
              <div className="stat-label">Total Raised</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.total_campaigns.toLocaleString()}</div>
              <div className="stat-label">Active Campaigns</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.total_donors.toLocaleString()}</div>
              <div className="stat-label">Generous Donors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Strip */}
      <div className="activity-wrapper">
        <div className="activity-strip">
          {/* Duplicated for smooth marquee effect */}
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex} style={{ display: 'inline-flex', gap: '24px' }}>
              <div className="activity-item">
                <div className="activity-pulse"></div>
                <strong>Sarah M.</strong> donated $50 to <em>Community Garden</em>
              </div>
              <div className="activity-item">
                <div className="activity-pulse"></div>
                <strong>David L.</strong> started a new campaign
              </div>
              <div className="activity-item">
                <div className="activity-pulse"></div>
                <strong>Emma W.</strong> reached 50% of her goal
              </div>
              <div className="activity-item">
                <div className="activity-pulse"></div>
                <strong>Alex K.</strong> donated $100 to <em>School Tech Fund</em>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Campaigns */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Trending Now</h2>
            <p>Discover projects that are gaining momentum and making a real difference in the community right now.</p>
          </div>

          {loading ? (
            <div className="grid grid-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}></div>
                  <div className="card-body">
                    <div className="skeleton mb-2" style={{ height: '24px', width: '80%' }}></div>
                    <div className="skeleton mb-3" style={{ height: '40px' }}></div>
                    <div className="skeleton" style={{ height: '12px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-3 mb-4">
                {featuredCampaigns.length > 0 ? (
                  featuredCampaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))
                ) : (
                  <div className="card card-body text-center" style={{ gridColumn: '1 / -1', padding: '60px 20px' }}>
                    <FiActivity size={48} className="text-muted mx-auto mb-3" />
                    <h3>No Campaigns Yet</h3>
                    <p className="text-secondary mb-4">Be the first to start a campaign and make an impact.</p>
                    <Link to="/campaigns/create" className="btn btn-primary">Start Campaign</Link>
                  </div>
                )}
              </div>
              {featuredCampaigns.length > 0 && (
                <div className="text-center mt-4">
                  <Link to="/explore" className="btn btn-lg btn-outline">
                    View All Campaigns <FiArrowRight />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Why DonatePlate?</h2>
            <p>We've built a platform that puts trust, transparency, and connection at the forefront of crowdfunding.</p>
          </div>

          <div className="steps-container">
            <div className="steps-connector"></div>
            <div className="grid grid-3">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-icon" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--teal-400)' }}>
                  <FiCheckCircle />
                </div>
                <h3 className="step-title">Verified Impact</h3>
                <p className="text-secondary">Every campaign organizer completes verification so you know exactly who you're supporting.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-icon" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--purple-400)' }}>
                  <FiShield />
                </div>
                <h3 className="step-title">Secure & Transparent</h3>
                <p className="text-secondary">Powered by Stripe for bank-level security. Track your donations end-to-end on the platform.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-icon" style={{ background: 'rgba(236,72,153,0.1)', color: 'var(--pink-400)' }}>
                  <FiTrendingUp />
                </div>
                <h3 className="step-title">Reward Tiers & Subscriptions</h3>
                <p className="text-secondary">Claim exclusive rewards or set up monthly recurring donations to support causes you love continuously.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 0', textAlign: 'center', background: 'var(--gradient-sunset)', color: '#fff' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>Ready to Serve Generosity?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px' }}>
            Join thousands of donors and creators making a difference every day on DonatePlate.
          </p>
          <div className="flex-center gap-2">
            <Link to="/register" className="btn btn-xl btn-primary" style={{ background: '#fff', color: 'var(--bg-primary)' }}>
              Create an Account
            </Link>
            <Link to="/explore" className="btn btn-xl" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              Explore Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
