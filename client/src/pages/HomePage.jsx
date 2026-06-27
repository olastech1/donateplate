import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiTrendingUp, FiShield, FiSearch } from 'react-icons/fi';
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
            Serve Generosity
          </div>
          <h1 className="animate-in" style={{ animationDelay: '0.2s' }}>
            Empower communities with <br />
            <span className="gradient-text">every plate shared.</span>
          </h1>
          <p className="animate-in" style={{ animationDelay: '0.3s' }}>
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
        </div>
      </section>

      {/* Stats Bar */}
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="stats-bar animate-scale" style={{ animationDelay: '0.6s' }}>
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

      {/* Featured Campaigns */}
      <section className="page" style={{ paddingTop: '100px' }}>
        <div className="container">
          <div className="section-header">
            <h2>Trending Now</h2>
            <p>Discover projects that are gaining momentum and making a real difference in the community right now.</p>
          </div>

          {loading ? (
            <div className="grid grid-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height: '220px' }}></div>
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
                {featuredCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
              <div className="text-center mt-4">
                <Link to="/explore" className="btn btn-lg btn-outline">
                  View All Campaigns <FiArrowRight />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How it Works / Value Props */}
      <section className="page" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Why DonatePlate?</h2>
            <p>We've built a platform that puts trust, transparency, and connection at the forefront of crowdfunding.</p>
          </div>

          <div className="grid grid-3">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon" style={{ background: 'var(--coral-50)', color: 'var(--coral-600)' }}>
                <FiHeart />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '10px' }}>Verified Impact</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Every campaign organizer completes KYC verification so you know exactly who you're supporting.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}>
                <FiShield />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '10px' }}>Secure & Transparent</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Powered by Stripe for bank-level security. Track your donations end-to-end on the blockchain.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon" style={{ background: 'var(--teal-50)', color: 'var(--teal-600)' }}>
                <FiTrendingUp />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '10px' }}>Reward Tiers & Subscriptions</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Claim exclusive rewards or set up monthly recurring donations to support causes you love continuously.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 0', textAlign: 'center', background: 'var(--gradient-sunset)', color: '#fff' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px' }}>Ready to Serve Generosity?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px' }}>
            Join thousands of donors and creators making a difference every day on DonatePlate.
          </p>
          <div className="flex-center gap-2">
            <Link to="/register" className="btn btn-xl" style={{ background: '#fff', color: 'var(--coral-600)' }}>
              Create an Account
            </Link>
            <Link to="/explore" className="btn btn-xl" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              Explore Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
