import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campaignAPI, userAPI, withdrawalAPI, updateAPI, recurringAPI, rewardAPI } from '../services/api';
import { FiUser, FiActivity, FiDollarSign, FiEdit3, FiRepeat, FiGift } from 'react-icons/fi';

const TABS = [
  { key: 'profile', label: 'Profile', icon: <FiUser /> },
  { key: 'campaigns', label: 'My Campaigns', icon: <FiActivity /> },
  { key: 'subscriptions', label: 'Recurring Donations', icon: <FiRepeat /> },
  { key: 'withdrawals', label: 'Withdrawals', icon: <FiDollarSign /> },
];

export default function CreatorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
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
        setCampaigns(res.data.data);
      } else if (tab === 'withdrawals') {
        const [withRes, campRes] = await Promise.all([
          withdrawalAPI.getMyWithdrawals(),
          campaignAPI.getMyCampaigns()
        ]);
        setWithdrawals(withRes.data.data);
        setCampaigns(campRes.data.data.filter(c => parseFloat(c.current_amount) > 0));
      } else if (tab === 'profile') {
        const res = await userAPI.getMe();
        setUserData(res.data.data);
      } else if (tab === 'subscriptions') {
        const res = await recurringAPI.getMySubscriptions();
        setSubscriptions(res.data.data);
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

  if (authLoading || !user) return <div className="page flex-center"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--slate-800)' }}>
            My Dashboard
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          {TABS.map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex-center py-4"><div className="spinner" /></div>
        ) : (
          <div className="animate-fade">
            {/* ── PROFILE TAB ── */}
            {tab === 'profile' && userData && (
              <div className="card card-glass">
                <div className="card-body">
                  <div className="flex-between mb-4">
                    <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)' }}>Profile Information</h2>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      setProfileForm({
                        bio: userData.bio || '',
                        location: userData.location || '',
                        website: userData.website || '',
                        avatar_url: userData.avatar_url || ''
                      });
                      setShowProfileModal(true);
                    }}>
                      <FiEdit3 style={{ display: 'inline', marginRight: '4px' }} /> Edit Profile
                    </button>
                  </div>
                  
                  <div className="grid grid-2" style={{ gap: '24px' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>Full Name</div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{userData.name}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>Email</div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{userData.email}</div>
                    </div>
                    {userData.bio && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Bio</div>
                        <div>{userData.bio}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>Location</div>
                      <div style={{ fontWeight: 600 }}>{userData.location || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>Website</div>
                      <div style={{ fontWeight: 600 }}>{userData.website ? <a href={userData.website} target="_blank" rel="noreferrer" className="text-accent">{userData.website}</a> : 'Not set'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CAMPAIGNS TAB ── */}
            {tab === 'campaigns' && (
              <>
                <div className="flex-between mb-4">
                  <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)' }}>My Campaigns</h2>
                  <Link to="/campaigns/create" className="btn btn-primary">Start New Campaign</Link>
                </div>

                {campaigns.length === 0 ? (
                  <div className="card text-center py-4">
                    <p className="text-muted">You haven't created any campaigns yet.</p>
                  </div>
                ) : (
                  campaigns.map(c => (
                    <div key={c.id} className="card mb-3 card-glass">
                      <div className="card-body">
                        <div className="flex-between mb-2">
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{c.title}</h3>
                          <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                        </div>
                        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                          Raised: ${Number(c.current_amount).toLocaleString()} / ${Number(c.goal_amount).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          {c.status === 'active' && (
                            <Link to={`/campaigns/${c.id}`} className="btn btn-outline btn-sm">View Page</Link>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => {
                            setActiveCampaignForUpdate(c.id);
                            setShowUpdateModal(true);
                          }}>Post Update</button>
                          <button className="btn btn-accent btn-sm" onClick={() => {
                            setActiveCampaignForReward(c.id);
                            setShowRewardModal(true);
                          }}>Add Reward Tier</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ── SUBSCRIPTIONS TAB ── */}
            {tab === 'subscriptions' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)', marginBottom: '16px' }}>My Recurring Donations</h2>
                {subscriptions.length === 0 ? (
                  <div className="card text-center py-4">
                    <p className="text-muted">You have no active recurring donations.</p>
                  </div>
                ) : (
                  <div className="grid grid-2">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="card card-glass">
                        <div className="card-body">
                          <h4 style={{ marginBottom: '8px' }}>{sub.campaign_title}</h4>
                          <div className="flex-between mb-3">
                            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>${sub.amount} / {sub.frequency}</span>
                            <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{sub.status}</span>
                          </div>
                          {sub.status === 'active' && (
                            <button className="btn btn-outline btn-sm btn-block" onClick={() => handleCancelSubscription(sub.id)}>
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
                 <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-800)', marginBottom: '16px' }}>Withdrawals</h2>
                 <p className="text-muted mb-4">Please contact admin to process manual payouts from your campaigns.</p>
                 <div className="card">
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '12px' }}>Date</th>
                          <th style={{ padding: '12px' }}>Amount</th>
                          <th style={{ padding: '12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.length === 0 ? (
                          <tr><td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No withdrawals yet.</td></tr>
                        ) : (
                          withdrawals.map(w => (
                            <tr key={w.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '12px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>${w.amount}</td>
                              <td style={{ padding: '12px' }}><span className="badge badge-category">{w.status}</span></td>
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
            <div className="card-body">
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Edit Profile</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows="3" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" value={profileForm.location} onChange={e => setProfileForm({...profileForm, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input type="url" className="form-input" placeholder="https://" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} />
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
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
            <div className="card-body">
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Add Reward Tier</h3>
              <form onSubmit={handleCreateReward}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-input" required value={rewardForm.title} onChange={e => setRewardForm({...rewardForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" required rows="2" value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})}></textarea>
                </div>
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Minimum Amount ($) *</label>
                    <input type="number" className="form-input" min="1" required value={rewardForm.min_amount} onChange={e => setRewardForm({...rewardForm, min_amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Claims (Optional)</label>
                    <input type="number" className="form-input" min="1" value={rewardForm.max_claims} onChange={e => setRewardForm({...rewardForm, max_claims: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
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
            <div className="card-body">
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Post Campaign Update</h3>
              <form onSubmit={handlePostUpdate}>
                <div className="form-group">
                  <label className="form-label">Update Title</label>
                  <input type="text" className="form-input" value={updateForm.title} onChange={e => setUpdateForm({...updateForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Update Message *</label>
                  <textarea className="form-textarea" required rows="4" value={updateForm.message} onChange={e => setUpdateForm({...updateForm, message: e.target.value})}></textarea>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
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
