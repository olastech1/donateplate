import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campaignAPI, userAPI, withdrawalAPI, updateAPI, recurringAPI, rewardAPI } from '../services/api';
import { FiUser, FiActivity, FiDollarSign, FiEdit3, FiRepeat, FiGift, FiPlus, FiArrowLeft, FiLogOut } from 'react-icons/fi';

const TABS = [
  { key: 'profile', label: 'Profile', icon: <FiUser /> },
  { key: 'campaigns', label: 'My Campaigns', icon: <FiActivity /> },
  { key: 'subscriptions', label: 'Recurring Donations', icon: <FiRepeat /> },
  { key: 'withdrawals', label: 'Withdrawals', icon: <FiDollarSign /> },
];

export default function CreatorDashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  
  const [campaigns, setCampaigns] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [userData, setUserData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [activeCampaignForUpdate, setActiveCampaignForUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({ title: '', message: '' });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Profile Edit Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: '', location: '', website: '', avatar_url: '' });

  // Reward Tier Modal
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [activeCampaignForReward, setActiveCampaignForReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({ title: '', description: '', min_amount: '', max_claims: '', image_url: '' });

  const fetchData = async () => {
    try {
      if (tab === 'campaigns') {
        const res = await campaignAPI.getMyCampaigns();
        setCampaigns(res.data.data || []);
      } else if (tab === 'withdrawals') {
        const [withRes, campRes] = await Promise.all([
          withdrawalAPI.getMyWithdrawals(),
          campaignAPI.getMyCampaigns()
        ]);
        setWithdrawals(withRes.data.data || []);
        setCampaigns((campRes.data.data || []).filter(c => parseFloat(c.current_amount) > 0));
      } else if (tab === 'profile') {
        const res = await userAPI.getMe();
        setUserData(res.data.data);
      } else if (tab === 'subscriptions') {
        const res = await recurringAPI.getMySubscriptions();
        setSubscriptions(res.data.data || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    fetchData();
  }, [tab, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(profileForm);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setShowProfileModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    }
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await rewardAPI.create(activeCampaignForReward, rewardForm);
      setMessage({ type: 'success', text: 'Reward tier added.' });
      setShowRewardModal(false);
      setRewardForm({ title: '', description: '', min_amount: '', max_claims: '', image_url: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add reward tier.' });
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.message) return;
    setUpdateLoading(true);
    try {
      await updateAPI.create(activeCampaignForUpdate, updateForm);
      setMessage({ type: 'success', text: 'Campaign update posted successfully.' });
      setShowUpdateModal(false);
      setUpdateForm({ title: '', message: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to post update.' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelSubscription = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this recurring donation?')) return;
    try {
      await recurringAPI.cancel(id);
      fetchData(); // Refresh list
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription.' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (authLoading || !user) return <div className="page flex-center"><div className="spinner" /></div>;

  return (
    <div className="dash-shell">
      {/* Sidebar Navigation */}
      <div className="dash-sidebar p-4" style={{ paddingTop: '32px' }}>
        <div style={{ padding: '0 24px 40px' }}>
          <Link to="/" className="navbar-logo" style={{ color: '#fff' }}>
            <span style={{ background: '#fff', color: 'var(--slate-900)', padding: '4px 8px', borderRadius: '8px' }}>DP</span>
            DonateFate
          </Link>
        </div>
        
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {TABS.map(t => (
            <button 
              key={t.key} 
              className={`btn btn-ghost ${tab === t.key ? 'active' : ''}`} 
              onClick={() => setTab(t.key)}
              style={{ 
                justifyContent: 'flex-start', 
                padding: '12px 16px',
                color: tab === t.key ? '#fff' : 'var(--slate-400)',
                background: tab === t.key ? 'var(--slate-800)' : 'transparent',
                fontWeight: tab === t.key ? 600 : 500
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px 16px', borderTop: '1px solid var(--slate-800)' }}>
          <button onClick={() => { logout(); navigate('/'); }} className="btn btn-ghost btn-block text-muted" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
            <FiLogOut /> Sign Out
          </button>
          <Link to="/" className="btn btn-ghost btn-block text-muted mt-1" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
            <FiArrowLeft /> Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dash-content">
        <div className="flex-between mb-4">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--slate-900)' }}>
            {TABS.find(t => t.key === tab)?.label}
          </h1>
          {tab === 'campaigns' && (
            <Link to="/campaigns/create" className="btn btn-primary">
              <FiPlus /> Start New Campaign
            </Link>
          )}
        </div>

        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex-center py-6"><div className="spinner" /></div>
        ) : (
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            
            {/* ── PROFILE TAB ── */}
            {tab === 'profile' && userData && (
              <div className="card card-glass">
                <div className="card-body" style={{ padding: '40px' }}>
                  <div className="flex-between mb-6">
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div className="profile-avatar flex-center" style={{ width: '80px', height: '80px', fontSize: '2rem', border: 'none', background: 'var(--gradient-cool)', color: '#fff' }}>
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-900)', marginBottom: '4px' }}>{userData.name}</h2>
                        <div className="badge badge-category">{userData.email}</div>
                      </div>
                    </div>
                    <button className="btn btn-outline" onClick={() => {
                      setProfileForm({
                        bio: userData.bio || '',
                        location: userData.location || '',
                        website: userData.website || '',
                        avatar_url: userData.avatar_url || ''
                      });
                      setShowProfileModal(true);
                    }}>
                      <FiEdit3 /> Edit Profile
                    </button>
                  </div>
                  
                  <div className="grid grid-2" style={{ gap: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                    {userData.bio && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="text-muted mb-1" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Bio</div>
                        <div style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--slate-800)' }}>{userData.bio}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-muted mb-1" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Location</div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--slate-900)' }}>{userData.location || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-muted mb-1" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Website</div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{userData.website ? <a href={userData.website} target="_blank" rel="noreferrer" className="text-accent">{userData.website}</a> : 'Not set'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CAMPAIGNS TAB ── */}
            {tab === 'campaigns' && (
              <>
                {campaigns.length === 0 ? (
                  <div className="card text-center py-6">
                    <FiActivity size={48} className="text-muted mx-auto mb-3" />
                    <h3 style={{ fontFamily: 'var(--font-display)' }}>No campaigns yet</h3>
                    <p className="text-secondary mb-4">Start your first campaign to begin serving generosity.</p>
                    <Link to="/campaigns/create" className="btn btn-primary">Start New Campaign</Link>
                  </div>
                ) : (
                  <div className="grid grid-2">
                    {campaigns.map(c => (
                      <div key={c.id} className="card card-glass flex flex-column">
                        <div className="card-body flex-1 flex flex-column">
                          <div className="flex-between mb-3">
                            <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '8px', color: 'var(--slate-900)' }}>{c.title}</h3>
                          
                          <div className="mt-auto pt-4 pb-4">
                            <div className="progress-track mb-2" style={{ height: '6px' }}>
                              <div className="progress-fill" style={{ width: `${Math.min(100, (c.current_amount / c.goal_amount) * 100)}%` }}></div>
                            </div>
                            <div className="flex-between text-muted" style={{ fontSize: '0.9rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{formatCurrency(c.current_amount)} raised</span>
                              <span>of {formatCurrency(c.goal_amount)}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-2 gap-2 mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                            {c.status === 'active' && (
                              <Link to={`/campaigns/${c.id}`} className="btn btn-outline btn-sm btn-block text-center">View Page</Link>
                            )}
                            <button className="btn btn-secondary btn-sm btn-block" onClick={() => {
                              setActiveCampaignForUpdate(c.id);
                              setShowUpdateModal(true);
                            }}>Post Update</button>
                            <button className="btn btn-accent btn-sm btn-block" style={{ gridColumn: c.status === 'active' ? '1 / -1' : 'auto' }} onClick={() => {
                              setActiveCampaignForReward(c.id);
                              setShowRewardModal(true);
                            }}><FiGift /> Add Reward Tier</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── SUBSCRIPTIONS TAB ── */}
            {tab === 'subscriptions' && (
              <>
                {subscriptions.length === 0 ? (
                  <div className="card text-center py-6">
                    <FiRepeat size={48} className="text-muted mx-auto mb-3" />
                    <h3 style={{ fontFamily: 'var(--font-display)' }}>No active subscriptions</h3>
                    <p className="text-secondary">You haven't set up any recurring donations yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-3">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="card card-glass">
                        <div className="card-body">
                          <h4 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)', color: 'var(--slate-900)', fontSize: '1.2rem', lineHeight: 1.3 }}>{sub.campaign_title}</h4>
                          <div className="flex-between mb-4">
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>${sub.amount}</span>
                            <span className="text-muted" style={{ fontWeight: 600, textTransform: 'capitalize' }}>/ {sub.frequency}</span>
                          </div>
                          <div className="mb-4">
                            <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{sub.status}</span>
                          </div>
                          {sub.status === 'active' && (
                            <button className="btn btn-outline btn-sm btn-block text-error" style={{ borderColor: 'var(--danger)' }} onClick={() => handleCancelSubscription(sub.id)}>
                              Cancel Subscription
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── WITHDRAWALS TAB ── */}
            {tab === 'withdrawals' && (
              <>
                 <div className="alert alert-info mb-4">
                    <FiAlertCircle size={20} />
                    <div>Please contact admin at <strong>support@donatefate.com</strong> to process manual payouts from your campaigns. Automated payouts are coming soon.</div>
                 </div>
                 <div className="card">
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--slate-50)' }}>
                          <th style={{ padding: '16px 24px', color: 'var(--slate-500)', fontWeight: 600 }}>Date Requested</th>
                          <th style={{ padding: '16px 24px', color: 'var(--slate-500)', fontWeight: 600 }}>Amount</th>
                          <th style={{ padding: '16px 24px', color: 'var(--slate-500)', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.length === 0 ? (
                          <tr><td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No withdrawals on record.</td></tr>
                        ) : (
                          withdrawals.map(w => (
                            <tr key={w.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '16px 24px', color: 'var(--slate-700)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--slate-900)' }}>{formatCurrency(w.amount)}</td>
                              <td style={{ padding: '16px 24px' }}><span className="badge badge-category">{w.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                 </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="card animate-in" style={{ width: '100%', maxWidth: '500px', background: '#fff' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Edit Profile</h3>
              <button className="btn btn-icon" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows="4" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Tell people about yourself..."></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" value={profileForm.location} onChange={e => setProfileForm({...profileForm, location: e.target.value})} placeholder="City, Country" />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input type="url" className="form-input" placeholder="https://" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} />
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '32px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="modal-overlay">
          <div className="card animate-in" style={{ width: '100%', maxWidth: '500px', background: '#fff' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Add Reward Tier</h3>
              <button className="btn btn-icon" onClick={() => setShowRewardModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateReward}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-input" required value={rewardForm.title} onChange={e => setRewardForm({...rewardForm, title: e.target.value})} placeholder="e.g. VIP Thank You Package" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" required rows="3" value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} placeholder="Describe what the donor will receive..."></textarea>
                </div>
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Minimum Amount ($) *</label>
                    <input type="number" className="form-input" min="1" required value={rewardForm.min_amount} onChange={e => setRewardForm({...rewardForm, min_amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Claims (Optional)</label>
                    <input type="number" className="form-input" min="1" value={rewardForm.max_claims} onChange={e => setRewardForm({...rewardForm, max_claims: e.target.value})} placeholder="Leave blank for unlimited" />
                  </div>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '32px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRewardModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Reward</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="card animate-in" style={{ width: '100%', maxWidth: '500px', background: '#fff' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Post Campaign Update</h3>
              <button className="btn btn-icon" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePostUpdate}>
                <div className="form-group">
                  <label className="form-label">Update Title</label>
                  <input type="text" className="form-input" value={updateForm.title} onChange={e => setUpdateForm({...updateForm, title: e.target.value})} placeholder="e.g. We reached 50%!" />
                </div>
                <div className="form-group">
                  <label className="form-label">Update Message *</label>
                  <textarea className="form-textarea" required rows="5" value={updateForm.message} onChange={e => setUpdateForm({...updateForm, message: e.target.value})} placeholder="Share your progress with your donors..."></textarea>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '32px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={updateLoading}>
                    {updateLoading ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
