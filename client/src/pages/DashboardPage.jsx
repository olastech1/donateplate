import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campaignAPI, userAPI, withdrawalAPI, updateAPI, recurringAPI, rewardAPI, donationAPI } from '../services/api';
import CampaignCard from '../components/campaign/CampaignCard';
import {
  FiUser, FiActivity, FiDollarSign, FiEdit3, FiRepeat,
  FiGift, FiPlus, FiArrowLeft, FiLogOut, FiHeart, FiShield,
  FiAlertTriangle, FiAlertCircle, FiExternalLink, FiMessageSquare,
  FiHome, FiTrendingUp, FiEye, FiMenu, FiX, FiCompass, FiInfo, FiMessageCircle, FiTrash2,
  FiCheckCircle, FiMapPin, FiLink, FiCalendar
} from 'react-icons/fi';

/* ── Tab definitions ── */
const TABS = [
  { key: 'overview',       label: 'Overview',            icon: <FiHome /> },
  { key: 'profile',        label: 'Profile',             icon: <FiUser /> },
  { key: 'impact',         label: 'My Donations',        icon: <FiHeart /> },
  { key: 'campaigns',      label: 'My Campaigns',        icon: <FiActivity /> },
  { key: 'subscriptions',  label: 'Subscriptions',       icon: <FiRepeat /> },
  { key: 'withdrawals',    label: 'Withdrawals',         icon: <FiDollarSign /> },
];

/* ── Helper ── */
const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const pct = (cur, goal) => Math.min(100, ((cur / goal) * 100) || 0).toFixed(0);

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  const [tab, setTab] = useState(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchTab = (key) => { setTab(key); setMobileMenuOpen(false); };

  /* data */
  const [campaigns, setCampaigns] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [userData, setUserData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  /* modals */
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: '', location: '', website: '', avatar_url: '' });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [updateForm, setUpdateForm] = useState({ title: '', message: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({ title: '', description: '', min_amount: '', max_claims: '' });
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [editCampaignForm, setEditCampaignForm] = useState({ title: '', description: '', goal_amount: '' });

  /* ── data fetching ── */
  const fetchData = async () => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      if (tab === 'overview' || tab === 'profile' || tab === 'impact') {
        const res = await userAPI.getMe();
        setUserData(res.data.data);
      }
      if (tab === 'profile') {
        const campRes = await campaignAPI.getMyCampaigns();
        setCampaigns(campRes.data.data || []);
      }
      if (tab === 'overview') {
        const [campRes, donRes] = await Promise.all([
          campaignAPI.getMyCampaigns(),
          donationAPI.getMyDonations(),
        ]);
        setCampaigns(campRes.data.data || []);
        setMyDonations(donRes.data.data || []);
      }
      if (tab === 'impact') {
        const donRes = await donationAPI.getMyDonations();
        setMyDonations(donRes.data.data || []);
      }
      if (tab === 'campaigns') {
        const campRes = await campaignAPI.getMyCampaigns();
        setCampaigns(campRes.data.data || []);
      }
      if (tab === 'withdrawals') {
        const [wRes, cRes] = await Promise.all([
          withdrawalAPI.getMyWithdrawals(),
          campaignAPI.getMyCampaigns(),
        ]);
        setWithdrawals(wRes.data.data || []);
        setCampaigns((cRes.data.data || []).filter(c => parseFloat(c.current_amount) > 0));
      }
      if (tab === 'subscriptions') {
        const res = await recurringAPI.getMySubscriptions();
        setSubscriptions(res.data.data || []);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) fetchData(); }, [tab, user]);

  /* ── handlers ── */
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(profileForm);
      setMsg({ type: 'success', text: 'Profile updated!' });
      setShowProfileModal(false);
      fetchData();
    } catch { setMsg({ type: 'error', text: 'Failed to update profile.' }); }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.message) return;
    setUpdateLoading(true);
    try {
      await updateAPI.create(activeCampaignId, updateForm);
      setMsg({ type: 'success', text: 'Update posted!' });
      setShowUpdateModal(false);
      setUpdateForm({ title: '', message: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to post update.' });
    } finally { setUpdateLoading(false); }
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await rewardAPI.create(activeCampaignId, rewardForm);
      setMsg({ type: 'success', text: 'Reward tier added!' });
      setShowRewardModal(false);
      setRewardForm({ title: '', description: '', min_amount: '', max_claims: '' });
    } catch { setMsg({ type: 'error', text: 'Failed to add reward tier.' }); }
  };

  const handleCancelSub = async (id) => {
    if (!window.confirm('Cancel this recurring donation?')) return;
    try { await recurringAPI.cancel(id); fetchData(); }
    catch { setMsg({ type: 'error', text: 'Failed to cancel subscription.' }); }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;
    try { 
      await campaignAPI.delete(id); 
      setMsg({ type: 'success', text: 'Campaign deleted.' });
      fetchData(); 
    }
    catch (err) { 
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete campaign.' }); 
    }
  };

  const openEditCampaign = (campaign) => {
    setActiveCampaignId(campaign.id);
    setEditCampaignForm({
      title: campaign.title || '',
      description: campaign.description || '',
      goal_amount: campaign.goal_amount || ''
    });
    setShowEditCampaignModal(true);
  };

  const handleEditCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      await campaignAPI.update(activeCampaignId, editCampaignForm);
      setMsg({ type: 'success', text: 'Campaign updated successfully.' });
      setShowEditCampaignModal(false);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update campaign.' });
    }
  };

  if (authLoading || !user) return <div className="page flex-center"><div className="spinner" /></div>;

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="dash-shell">

      {/* Mobile menu overlay */}
      {mobileMenuOpen && <div className="dash-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* Mobile top bar */}
      <div className="dash-mobile-bar">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slate-900)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem' }}>
          <span style={{ fontSize: '1.1em' }}>🍩</span> DonatePlate
        </Link>
        <button className="dash-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* ── SIDEBAR ── */}
      <aside className={`dash-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* brand */}
        <div className="dash-brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.2em' }}>🍩</span> DonatePlate
          </Link>
        </div>

        {/* user card */}
        <div className="dash-user-card">
          <div className="dash-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="dash-user-info">
            <span className="dash-user-name">{user.name}</span>
            <span className="dash-user-email">{user.email}</span>
          </div>
        </div>

        {/* nav */}
        <nav className="dash-nav">
          <div className="dash-nav-section-title">Dashboard</div>
          {TABS.map(t => (
            <button key={t.key} className={`dash-nav-btn ${tab === t.key ? 'active' : ''}`} onClick={() => switchTab(t.key)}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}

          <div className="dash-nav-section-title" style={{ marginTop: '24px' }}>Site</div>
          <Link to="/explore" className="dash-nav-btn" style={{ textDecoration: 'none' }}>
            <FiCompass /><span>Explore</span>
          </Link>
          <Link to="/about" className="dash-nav-btn" style={{ textDecoration: 'none' }}>
            <FiInfo /><span>About</span>
          </Link>
          <Link to="/contact" className="dash-nav-btn" style={{ textDecoration: 'none' }}>
            <FiMessageCircle /><span>Contact</span>
          </Link>
        </nav>

        {/* footer */}
        <div className="dash-sidebar-footer">
          <Link to="/campaigns/create" className="dash-create-btn"><FiPlus /> New Campaign</Link>
          <button onClick={() => { logout(); navigate('/'); }} className="dash-nav-btn" style={{ color: 'var(--slate-400)' }}><FiLogOut /><span>Sign Out</span></button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">{TABS.find(t => t.key === tab)?.label}</h1>
            <p className="dash-subtitle">Welcome back, {user.name?.split(' ')[0]}</p>
          </div>
          {tab === 'campaigns' && (
            <Link to="/campaigns/create" className="btn btn-primary"><FiPlus /> New Campaign</Link>
          )}
        </div>

        {/* Messages */}
        {msg.text && (
          <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 24 }}>{msg.text}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex-center" style={{ padding: '80px 0' }}><div className="spinner" /></div>
        ) : (

        <div className="dash-body">

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && userData && (
            <>
              {/* stat cards */}
              <div className="dash-stats">
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent)' }}><FiTrendingUp /></div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">{currency(userData.total_donated)}</span>
                    <span className="dash-stat-label">Total Donated</span>
                  </div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--pink-400)' }}><FiHeart /></div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">{userData.total_campaigns_supported || 0}</span>
                    <span className="dash-stat-label">Campaigns Supported</span>
                  </div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--teal-400)' }}><FiActivity /></div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">{campaigns.length}</span>
                    <span className="dash-stat-label">My Campaigns</span>
                  </div>
                </div>
              </div>

              {/* recent donations */}
              <div className="dash-section">
                <div className="dash-section-header">
                  <h3>Recent Donations</h3>
                  <button className="dash-link-btn" onClick={() => setTab('impact')}>View all →</button>
                </div>
                {myDonations.length === 0 ? (
                  <div className="dash-empty">No donations yet. <Link to="/explore">Explore campaigns</Link></div>
                ) : (
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead><tr><th>Campaign</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {myDonations.slice(0, 5).map(d => (
                          <tr key={d.id}>
                            <td><Link to={`/campaigns/${d.campaign_id}`}>{d.campaign_title}</Link></td>
                            <td className="font-bold">{currency(d.amount)}</td>
                            <td className="text-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                            <td><span className={`dash-badge ${d.status === 'success' ? 'dash-badge-success' : 'dash-badge-warning'}`}>{d.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* my campaigns preview */}
              {campaigns.length > 0 && (
                <div className="dash-section">
                  <div className="dash-section-header">
                    <h3>My Campaigns</h3>
                    <button className="dash-link-btn" onClick={() => setTab('campaigns')}>View all →</button>
                  </div>
                  <div className="dash-campaign-grid">
                    {campaigns.slice(0, 3).map(c => (
                      <div key={c.id} className="dash-campaign-card">
                        <div className="dash-campaign-info">
                          <span className={`dash-badge ${c.status === 'active' ? 'dash-badge-success' : 'dash-badge-warning'}`}>{c.status}</span>
                          <h4>{c.title}</h4>
                          <div className="dash-progress-wrap">
                            <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${pct(c.current_amount, c.goal_amount)}%` }} /></div>
                            <div className="dash-progress-text"><span>{currency(c.current_amount)}</span><span className="text-muted">of {currency(c.goal_amount)}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ PROFILE ═══ */}
          {tab === 'profile' && userData && (
            <div className="animate-in">
              <div className="profile-header">
                {/* Decorative background elements inside header */}
                <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--coral-500) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(40px)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', bottom: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--teal-400) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(40px)', zIndex: 0 }}></div>
                
                <div className="profile-avatar flex-shrink-0">
                  {userData.avatar_url ? (
                    <img src={userData.avatar_url} alt={userData.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    userData.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="profile-info flex-1">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{userData.name}</h1>
                    <button className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => { setProfileForm({ bio: userData.bio || '', location: userData.location || '', website: userData.website || '', avatar_url: userData.avatar_url || '' }); setShowProfileModal(true); }}>
                      <FiEdit3 /> Edit Profile
                    </button>
                  </div>
                  
                  {userData.bio && <p className="profile-bio" style={{ fontSize: '1.05rem', color: 'var(--slate-200)', maxWidth: '700px', lineHeight: 1.6, marginTop: '12px', marginBottom: '20px' }}>{userData.bio}</p>}
                  {!userData.bio && <p style={{ marginTop: '12px', marginBottom: '20px' }}></p>}
                  
                  <div className="profile-meta flex flex-wrap" style={{ gap: '20px', alignItems: 'center' }}>
                    <div className="badge badge-success" style={{ background: 'rgba(20,184,166,0.2)', border: '1px solid var(--teal-500)' }}>
                      <FiCheckCircle style={{ marginRight: '4px' }} /> {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                    </div>
                    {userData.email_verified
                      ? <div className="flex items-center gap-1" style={{ color: 'var(--teal-300)' }}><FiShield /> Verified Email</div>
                      : <div className="flex items-center gap-1" style={{ color: 'var(--warning)' }}><FiAlertTriangle /> Unverified Email</div>
                    }
                    {userData.location && (
                      <div className="flex items-center gap-1" style={{ color: 'var(--slate-300)' }}>
                        <FiMapPin /> {userData.location}
                      </div>
                    )}
                    {userData.website && (
                      <div className="flex items-center gap-1" style={{ color: 'var(--slate-300)' }}>
                        <FiLink /> <a href={userData.website} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Website</a>
                      </div>
                    )}
                    <div className="flex items-center gap-1" style={{ color: 'var(--slate-300)' }}>
                      <FiCalendar /> Joined {new Date(userData.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="profile-stats" style={{ position: 'relative', zIndex: 10, marginTop: '-24px' }}>
                <div className="profile-stat-card card-glass card-hover">
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34,211,238,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <FiHeart size={24} />
                  </div>
                  <div className="profile-stat-value">{currency(userData.total_donated)}</div>
                  <div className="profile-stat-label">Total Impact</div>
                </div>
                <div className="profile-stat-card card-glass card-hover">
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168,85,247,0.1)', color: 'var(--purple-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <FiTrendingUp size={24} />
                  </div>
                  <div className="profile-stat-value">{userData.total_campaigns_supported || 0}</div>
                  <div className="profile-stat-label">Causes Supported</div>
                </div>
                <div className="profile-stat-card card-glass card-hover">
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem' }}>
                    🍽️
                  </div>
                  <div className="profile-stat-value">{campaigns.length}</div>
                  <div className="profile-stat-label">Campaigns Created</div>
                </div>
              </div>

              {/* User's Campaigns */}
              <div className="animate-in" style={{ animationDelay: '0.2s', marginTop: '48px', marginBottom: '24px' }}>
                <div className="flex-between mb-4">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--slate-900)' }}>
                    Campaigns by {userData.name}
                  </h3>
                </div>
                
                {campaigns.length > 0 ? (
                  <div className="grid grid-3">
                    {campaigns.map(campaign => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                ) : (
                  <div className="card text-center" style={{ padding: '60px 24px', background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
                    <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>You haven't created any active campaigns yet.</p>
                    <Link to="/campaigns/create" className="btn btn-primary"><FiPlus /> Create Campaign</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ MY DONATIONS ═══ */}
          {tab === 'impact' && userData && (
            <>
              <div className="dash-stats">
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}><FiTrendingUp /></div>
                  <div className="dash-stat-info"><span className="dash-stat-value">{currency(userData.total_donated)}</span><span className="dash-stat-label">Total Donated</span></div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><FiHeart /></div>
                  <div className="dash-stat-info"><span className="dash-stat-value">{userData.total_campaigns_supported || 0}</span><span className="dash-stat-label">Campaigns Supported</span></div>
                </div>
              </div>
              <div className="dash-section">
                <h3 style={{ marginBottom: 16 }}>Donation History</h3>
                {myDonations.length === 0 ? (
                  <div className="dash-empty">You haven't made any donations yet. <Link to="/explore">Explore campaigns</Link></div>
                ) : (
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead><tr><th>Campaign</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {myDonations.map(d => (
                          <tr key={d.id}>
                            <td><Link to={`/campaigns/${d.campaign_id}`}>{d.campaign_title}</Link></td>
                            <td className="font-bold">{currency(d.amount)}</td>
                            <td className="text-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                            <td><span className={`dash-badge ${d.status === 'success' ? 'dash-badge-success' : 'dash-badge-warning'}`}>{d.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ MY CAMPAIGNS ═══ */}
          {tab === 'campaigns' && (
            <>
              {campaigns.length === 0 ? (
                <div className="dash-empty-state">
                  <FiActivity size={48} />
                  <h3>No campaigns yet</h3>
                  <p>Start your first campaign and begin making a difference.</p>
                  <Link to="/campaigns/create" className="btn btn-primary"><FiPlus /> Create Campaign</Link>
                </div>
              ) : (
                <div className="dash-campaign-grid">
                  {campaigns.map(c => (
                    <div key={c.id} className="dash-campaign-card">
                      <div className="dash-campaign-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span className={`dash-badge ${c.status === 'active' ? 'dash-badge-success' : 'dash-badge-warning'}`}>{c.status}</span>
                          <span className="text-muted" style={{ fontSize: '0.82rem' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4>{c.title}</h4>
                        <div className="dash-progress-wrap">
                          <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${pct(c.current_amount, c.goal_amount)}%` }} /></div>
                          <div className="dash-progress-text"><span className="font-bold">{currency(c.current_amount)}</span><span className="text-muted">of {currency(c.goal_amount)} ({pct(c.current_amount, c.goal_amount)}%)</span></div>
                        </div>
                        <div className="dash-campaign-actions">
                          {c.status === 'active' && <Link to={`/campaigns/${c.id}`} className="btn btn-sm btn-outline"><FiEye /> View</Link>}
                          <button className="btn btn-sm btn-secondary" onClick={() => { setActiveCampaignId(c.id); setShowUpdateModal(true); }}><FiMessageSquare /> Post Update</button>
                          <button className="btn btn-sm btn-outline" onClick={() => { setActiveCampaignId(c.id); setShowRewardModal(true); }}><FiGift /> Add Reward</button>
                          {/* Quick Actions */}
                          <button className="btn btn-sm btn-outline" style={{ color: 'var(--slate-600)', borderColor: 'var(--slate-300)' }} onClick={() => openEditCampaign(c)}><FiEdit3 /> Edit</button>
                          <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeleteCampaign(c.id)}><FiTrash2 /> Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ SUBSCRIPTIONS ═══ */}
          {tab === 'subscriptions' && (
            <>
              {subscriptions.length === 0 ? (
                <div className="dash-empty-state">
                  <FiRepeat size={48} />
                  <h3>No active subscriptions</h3>
                  <p>Set up recurring donations to continuously support campaigns you love.</p>
                  <Link to="/explore" className="btn btn-primary">Explore Campaigns</Link>
                </div>
              ) : (
                <div className="dash-campaign-grid">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="dash-campaign-card">
                      <div className="dash-campaign-info">
                        <h4>{sub.campaign_title}</h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '12px 0' }}>
                          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{currency(sub.amount)}</span>
                          <span className="text-muted" style={{ fontWeight: 500 }}>/ {sub.frequency}</span>
                        </div>
                        <span className={`dash-badge ${sub.status === 'active' ? 'dash-badge-success' : 'dash-badge-danger'}`}>{sub.status}</span>
                        {sub.status === 'active' && (
                          <button className="btn btn-sm btn-outline" style={{ marginTop: 16, color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleCancelSub(sub.id)}>Cancel</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ WITHDRAWALS ═══ */}
          {tab === 'withdrawals' && (
            <>
              <div className="alert alert-info" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FiAlertCircle size={20} />
                <span>Contact <strong>support@donateplate.com</strong> for manual payouts. Automated payouts coming soon.</span>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr><td colSpan="3" className="text-center text-muted" style={{ padding: 32 }}>No withdrawals on record.</td></tr>
                    ) : withdrawals.map(w => (
                      <tr key={w.id}>
                        <td>{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="font-bold">{currency(w.amount)}</td>
                        <td><span className="dash-badge dash-badge-neutral">{w.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
        )}
      </main>

      {/* ═══ MODALS ═══ */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Profile</h3><button className="btn btn-icon" onClick={() => setShowProfileModal(false)}>✕</button></div>
            <form onSubmit={handleUpdateProfile} className="modal-body">
              <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" rows="3" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Tell people about yourself..." /></div>
              <div className="form-group"><label className="form-label">Location</label><input type="text" className="form-input" value={profileForm.location} onChange={e => setProfileForm({...profileForm, location: e.target.value})} placeholder="City, Country" /></div>
              <div className="form-group"><label className="form-label">Website</label><input type="url" className="form-input" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} placeholder="https://" /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Post Campaign Update</h3><button className="btn btn-icon" onClick={() => setShowUpdateModal(false)}>✕</button></div>
            <form onSubmit={handlePostUpdate} className="modal-body">
              <div className="form-group"><label className="form-label">Title</label><input type="text" className="form-input" value={updateForm.title} onChange={e => setUpdateForm({...updateForm, title: e.target.value})} placeholder="e.g. We hit 50%!" /></div>
              <div className="form-group"><label className="form-label">Message *</label><textarea className="form-textarea" rows="4" required value={updateForm.message} onChange={e => setUpdateForm({...updateForm, message: e.target.value})} placeholder="Share progress with your donors..." /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updateLoading}>{updateLoading ? 'Posting...' : 'Post Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRewardModal && (
        <div className="modal-overlay" onClick={() => setShowRewardModal(false)}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Reward Tier</h3><button className="btn btn-icon" onClick={() => setShowRewardModal(false)}>✕</button></div>
            <form onSubmit={handleCreateReward} className="modal-body">
              <div className="form-group"><label className="form-label">Title *</label><input type="text" className="form-input" required value={rewardForm.title} onChange={e => setRewardForm({...rewardForm, title: e.target.value})} placeholder="e.g. VIP Thank You Package" /></div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" rows="3" required value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} placeholder="What the donor receives..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Min Amount ($) *</label><input type="number" className="form-input" min="1" required value={rewardForm.min_amount} onChange={e => setRewardForm({...rewardForm, min_amount: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Max Claims</label><input type="number" className="form-input" min="1" value={rewardForm.max_claims} onChange={e => setRewardForm({...rewardForm, max_claims: e.target.value})} placeholder="Unlimited" /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRewardModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Reward</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditCampaignModal && (
        <div className="modal-overlay" onClick={() => setShowEditCampaignModal(false)}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Campaign</h3><button className="btn btn-icon" onClick={() => setShowEditCampaignModal(false)}>✕</button></div>
            <form onSubmit={handleEditCampaignSubmit} className="modal-body">
              <div className="form-group"><label className="form-label">Title *</label><input type="text" className="form-input" required value={editCampaignForm.title} onChange={e => setEditCampaignForm({...editCampaignForm, title: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" rows="4" required value={editCampaignForm.description} onChange={e => setEditCampaignForm({...editCampaignForm, description: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Goal Amount ($) *</label><input type="number" className="form-input" min="1" required value={editCampaignForm.goal_amount} onChange={e => setEditCampaignForm({...editCampaignForm, goal_amount: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditCampaignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
