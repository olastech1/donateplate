import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';

// ── Nav config ──────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Platform',
    items: [
      { key: 'overview',   label: 'Overview',        icon: '▣' },
      { key: 'analytics',  label: 'Analytics',       icon: '📈' },
      { key: 'activity',   label: 'Activity Log',    icon: '🔄' },
    ]
  },
  {
    label: 'Management',
    items: [
      { key: 'users',      label: 'Users',           icon: '👥' },
      { key: 'campaigns',  label: 'Campaigns',       icon: '📋' },
      { key: 'kyc',        label: 'KYC Reviews',     icon: '🛡️' },
      { key: 'withdrawals',label: 'Withdrawals',     icon: '💸' },
      { key: 'donations',  label: 'Donations',       icon: '💳' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { key: 'broadcast',  label: 'Broadcast Email', icon: '📧' },
      { key: 'settings',   label: 'Settings',        icon: '⚙️' },
    ]
  },
];

// ── Helpers ──────────────────────────────────────────────────
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtDate  = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime  = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── Status badge helper ──────────────────────────────────────
function Badge({ status }) {
  const s = (status || '').toLowerCase();
  return <span className={`adm-badge ${s}`}>{status}</span>;
}

// ── Setting Field ─────────────────────────────────────────────
function SettingField({ setting, onSave }) {
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f1f5f9', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', marginBottom: '2px' }}>
          {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{setting.description}</div>
        {!editing && <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', fontFamily: 'monospace' }}>{setting.display_value || '(not set)'}</div>}
      </div>
      {editing ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type={setting.is_encrypted ? 'password' : 'text'}
            className="adm-input"
            style={{ maxWidth: '240px' }}
            placeholder={setting.is_encrypted ? 'Enter new key...' : 'Enter value...'}
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <button className="adm-btn primary sm" onClick={() => { onSave(setting.setting_key, value); setEditing(false); setValue(''); }}>Save</button>
          <button className="adm-btn ghost sm" onClick={() => { setEditing(false); setValue(''); }}>Cancel</button>
        </div>
      ) : (
        <button className="adm-btn secondary sm" onClick={() => setEditing(true)}>✏️ Edit</button>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  // Navigation
  const [tab, setTab]             = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [stats, setStats]         = useState(null);
  const [pending, setPending]     = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycList, setKycList]     = useState([]);
  const [donations, setDonations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [settings, setSettings]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  // UI state
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage]           = useState({ type: '', text: '' });

  // Modals
  const [previewDocument, setPreviewDocument]   = useState(null);
  const [showBanModal, setShowBanModal]         = useState(false);
  const [banForm, setBanForm]                   = useState({ ban_type: 'temporary', duration_days: 7, reason: '' });
  const [selectedUserId, setSelectedUserId]     = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [addFundsModal, setAddFundsModal]       = useState({ open: false, userId: '', userName: '', campaigns: [], selectedCampaign: '', amount: '', actionType: 'add' });

  // Broadcast / Settings
  const [selectedPage, setSelectedPage]     = useState('page_about_us');
  const [pageContent, setPageContent]       = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTarget, setBroadcastTarget]   = useState('all_users');
  const [broadcastSelectedUsers, setBroadcastSelectedUsers] = useState([]);
  const [profileData, setProfileData]   = useState({ email: '', currentPassword: '', newPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [verifyLoading, setVerifyLoading]   = useState(false);
  const [verifyResult, setVerifyResult]     = useState(null);

  // Reset search / filter on tab change
  useEffect(() => { setSearchQuery(''); setStatusFilter('all'); }, [tab]);

  // Auth guard
  useEffect(() => { if (user && user.role !== 'admin') navigate('/'); }, [user, navigate]);

  // Set initial email
  useEffect(() => {
    if (user?.email && !profileData.email) setProfileData(prev => ({ ...prev, email: user.email }));
  }, [user]);

  // Page content watcher
  useEffect(() => {
    if (tab === 'settings' && settings.length > 0) {
      const s = settings.find(s => s.setting_key === selectedPage);
      if (s) setPageContent(s.display_value);
    }
  }, [tab, selectedPage, settings]);

  // Fetch tab data
  useEffect(() => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const fetch = async () => {
      try {
        if (tab === 'overview') {
          const [st, act] = await Promise.all([adminAPI.getStats(), adminAPI.getActivityLog()]);
          setStats(st.data.data);
          setActivityLog(act.data.data.slice(0, 6));
        } else if (tab === 'analytics') {
          const res = await adminAPI.getAnalytics();
          setAnalytics(res.data.data);
        } else if (tab === 'activity') {
          const res = await adminAPI.getActivityLog();
          setActivityLog(res.data.data);
        } else if (tab === 'campaigns') {
          const res = await adminAPI.getAllCampaigns();
          setPending(res.data.data);
        } else if (tab === 'withdrawals') {
          const res = await adminAPI.getPendingWithdrawals();
          setWithdrawals(res.data.data);
        } else if (tab === 'kyc') {
          const res = await adminAPI.getAllKyc();
          setKycList(res.data.data);
        } else if (tab === 'users') {
          const res = await adminAPI.getUsers();
          setUsersList(res.data.data);
        } else if (tab === 'donations') {
          const res = await adminAPI.getDonations();
          setDonations(res.data.data);
        } else if (tab === 'broadcast') {
          const res = await adminAPI.getUsers();
          setUsersList(res.data.data);
        } else if (tab === 'settings') {
          const res = await adminAPI.getSettings();
          setSettings(res.data.data);
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load dashboard data.' });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tab]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCampaignAction = async (id, action) => {
    setActionLoading(id);
    try {
      if (action === 'approve') await adminAPI.approve(id);
      else await adminAPI.reject(id, 'Does not meet guidelines.');
      setPending(prev => prev.map(c => c.id === id ? { ...c, status: action === 'approve' ? 'active' : 'rejected' } : c));
      setMessage({ type: 'success', text: `Campaign ${action}d successfully.` });
    } catch { setMessage({ type: 'error', text: `Failed to ${action} campaign.` }); }
    finally { setActionLoading(''); }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    setActionLoading(`del-${id}`);
    try {
      await adminAPI.deleteCampaign(id);
      setPending(prev => prev.filter(c => c.id !== id));
      setMessage({ type: 'success', text: 'Campaign deleted.' });
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleToggleSeo = async (id) => {
    setActionLoading(`seo-${id}`);
    try {
      const res = await adminAPI.toggleSeoVisibility(id);
      const v = res.data.data.seo_visible;
      setPending(prev => prev.map(c => c.id === id ? { ...c, seo_visible: v } : c));
      setMessage({ type: 'success', text: `SEO ${v ? 'enabled' : 'disabled'}.` });
    } catch { setMessage({ type: 'error', text: 'Failed to toggle SEO.' }); }
    finally { setActionLoading(''); }
  };

  const handleToggleCampaign = async (id) => {
    setActionLoading(`tog-${id}`);
    try {
      const res = await adminAPI.toggleCampaign(id);
      const ns = res.data.data.status;
      setPending(prev => prev.map(c => c.id === id ? { ...c, status: ns } : c));
      setMessage({ type: 'success', text: `Campaign ${ns === 'active' ? 'activated' : 'paused'}.` });
    } catch { setMessage({ type: 'error', text: 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleAddFunds = async (id, title) => {
    const a = prompt(`Amount to add to "${title}" ($):`);
    if (!a) return;
    const amt = parseFloat(a);
    if (isNaN(amt) || amt <= 0) { alert('Invalid amount.'); return; }
    setActionLoading(`funds-${id}`);
    try {
      const res = await adminAPI.addFunds(id, amt);
      const r   = await adminAPI.getAllCampaigns();
      setPending(r.data.data);
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleOpenAddUserFunds = async (id, name) => {
    setActionLoading(`user-funds-${id}`);
    try {
      let uc = pending.filter(c => c.creator_id === id && (c.status === 'active' || c.status === 'paused'));
      if (!uc.length) { const r = await adminAPI.getAllCampaigns(); uc = r.data.data.filter(c => c.creator_id === id && (c.status === 'active' || c.status === 'paused')); }
      setAddFundsModal({ open: true, userId: id, userName: name, campaigns: uc, selectedCampaign: '', amount: '', actionType: 'add' });
    } catch { setMessage({ type: 'error', text: 'Failed to fetch campaigns.' }); }
    finally { setActionLoading(''); }
  };

  const submitAddUserFunds = async (e) => {
    e.preventDefault();
    const { userId, selectedCampaign, amount, actionType } = addFundsModal;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { alert('Invalid amount.'); return; }
    setActionLoading(`user-funds-${userId}`);
    try {
      const res = actionType === 'subtract'
        ? await adminAPI.subtractUserFunds(userId, amt, selectedCampaign || null)
        : await adminAPI.addUserFunds(userId, amt, selectedCampaign || null);
      setMessage({ type: 'success', text: res.data.message });
      setAddFundsModal({ open: false, userId: '', userName: '', campaigns: [], selectedCampaign: '', amount: '', actionType: 'add' });
      const r = await adminAPI.getUsers(); setUsersList(r.data.data);
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleDeleteDonation = async (id) => {
    if (!window.confirm('Delete this donation record?')) return;
    setActionLoading(`del-don-${id}`);
    try {
      await adminAPI.deleteDonation(id);
      setDonations(prev => prev.filter(d => d.id !== id));
      setMessage({ type: 'success', text: 'Donation deleted.' });
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleUserBan = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setActionLoading(`user-ban-${selectedUserId}`);
    try {
      const res = await adminAPI.banUser(selectedUserId, { ban_type: banForm.ban_type, duration_days: banForm.ban_type === 'temporary' ? parseInt(banForm.duration_days) : null, reason: banForm.reason });
      setMessage({ type: 'success', text: res.data.message });
      setShowBanModal(false);
      setBanForm({ ban_type: 'temporary', duration_days: 7, reason: '' });
      const r = await adminAPI.getUsers(); setUsersList(r.data.data);
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleUserUnban = async (id, name) => {
    if (!window.confirm(`Unban "${name}"?`)) return;
    setActionLoading(`user-unban-${id}`);
    try {
      const res = await adminAPI.unbanUser(id);
      setMessage({ type: 'success', text: res.data.message });
      const r = await adminAPI.getUsers(); setUsersList(r.data.data);
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleVerifyUser = async (id, name) => {
    if (!window.confirm(`Manually verify email for user "${name}"?`)) return;
    setActionLoading(`verify-${id}`);
    try {
      const res = await adminAPI.verifyUser(id);
      setMessage({ type: 'success', text: res.data.message });
      const r = await adminAPI.getUsers(); setUsersList(r.data.data);
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleWithdrawalAction = async (id, action, method = 'manual') => {
    setActionLoading(id);
    try {
      if (action === 'approve') await adminAPI.approveWithdrawal(id, method);
      else await adminAPI.rejectWithdrawal(id);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
      setMessage({ type: 'success', text: `Withdrawal ${action}d.` });
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handleKycAction = async (id, action) => {
    setActionLoading(`kyc-${id}`);
    try {
      if (action === 'approve') await adminAPI.approveKyc(id);
      else await adminAPI.rejectKyc(id);
      setKycList(prev => prev.map(k => k.id === id ? { ...k, kyc_status: action === 'approve' ? 'verified' : 'rejected' } : k));
      setMessage({ type: 'success', text: `KYC ${action}d.` });
    } catch { setMessage({ type: 'error', text: `Failed to ${action} KYC.` }); }
    finally { setActionLoading(''); }
  };

  const handleExportEmails = async () => {
    try {
      setActionLoading('export');
      const res = await adminAPI.exportEmails(broadcastTarget);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.setAttribute('download', `emails-export-${broadcastTarget}-${Date.now()}.csv`);
      document.body.appendChild(a); a.click(); a.parentNode.removeChild(a);
      setMessage({ type: 'success', text: 'Email list exported.' });
    } catch { setMessage({ type: 'error', text: 'Failed to export.' }); }
    finally { setActionLoading(''); }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject || !broadcastContent) return setMessage({ type: 'error', text: 'Subject and Content are required.' });
    let userIds = [];
    if (broadcastTarget === 'selected') {
      userIds = broadcastSelectedUsers;
      if (!userIds.length) return setMessage({ type: 'error', text: 'Select at least one user.' });
    }
    setActionLoading('broadcast');
    try {
      const res = await adminAPI.broadcastEmail({ subject: broadcastSubject, htmlContent: broadcastContent, userIds, targetAudience: broadcastTarget });
      setMessage({ type: 'success', text: res.data.message || 'Broadcast sent!' });
      setBroadcastSubject(''); setBroadcastContent(''); setBroadcastTarget('all_users'); setBroadcastSelectedUsers([]);
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const handlePageSave = async () => {
    setActionLoading('save-page');
    try { await adminAPI.updateSetting(selectedPage, pageContent); setMessage({ type: 'success', text: 'Page content updated.' }); }
    catch { setMessage({ type: 'error', text: 'Failed to update page.' }); }
    finally { setActionLoading(''); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      await adminAPI.updateProfile(profileData);
      alert('Profile updated! You may need to log in again if you changed your password.');
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) { alert(err.response?.data?.message || 'Failed to update profile'); }
    finally { setProfileLoading(false); }
  };

  const handleSettingUpdate = async (key, value) => {
    setActionLoading(key);
    try {
      await adminAPI.updateSetting(key, value);
      setMessage({ type: 'success', text: 'Setting updated.' });
      const res = await adminAPI.getSettings(); setSettings(res.data.data);
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(null); }
  };

  const handleTestEmail = async () => {
    const email = prompt('Enter email address to send test to:');
    if (!email) return;
    setActionLoading('test-email');
    try { await adminAPI.testEmail({ to: email }); setMessage({ type: 'success', text: `Test email sent to ${email}.` }); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send test email.' }); }
    finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? Cannot be undone.')) return;
    setActionLoading(`user-del-${id}`);
    try { await adminAPI.deleteUser(id); setUsersList(prev => prev.filter(u => u.id !== id)); setMessage({ type: 'success', text: 'User deleted.' }); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setActionLoading(''); }
  };

  const exportDonationsCSV = () => {
    const csv = [
      ['Date', 'Campaign', 'Donor', 'Amount', 'Status'].join(','),
      ...donations.map(d => [
        new Date(d.created_at).toLocaleDateString(),
        `"${d.campaign_title}"`,
        `"${d.is_anonymous ? 'Anonymous' : (d.donor_user_name || d.guest_name || 'Guest')}"`,
        d.amount, d.status
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `donations-${Date.now()}.csv`; a.click();
  };

  if (!user || user.role !== 'admin') return null;

  // ── Pending counts for badges ──
  const pendingCampaignsCount  = pending.filter(c => c.status === 'pending').length;
  const pendingKycCount        = kycList.filter(k => k.kyc_status === 'pending').length;
  const pendingWithdrawals     = withdrawals.length;
  const totalPendingActions    = pendingCampaignsCount + pendingKycCount + pendingWithdrawals;

  // ── Current tab label ──
  const currentTabLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.key === tab)?.label || '';

  // ── Campaign filter ──
  const filteredCampaigns = pending.filter(c =>
    (statusFilter === 'all' || c.status === statusFilter) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.creator_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ── Users filter ──
  const filteredUsers = usersList.filter(u =>
    (statusFilter === 'all' || u.role === statusFilter) &&
    ((u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ── Donations filter ──
  const filteredDonations = donations.filter(d =>
    (statusFilter === 'all' || d.status === statusFilter) &&
    ((d.campaign_title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (d.donor_user_name || d.guest_name || 'Guest').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="admin-shell" id="admin-dashboard">

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="adm-logo">
          <div className="adm-logo-mark">🍽️</div>
          <span className="adm-logo-text">DonateFate</span>
          <span className="adm-logo-badge">Admin</span>
        </div>

        {/* Admin user */}
        <div className="adm-user-card">
          <div className="adm-user-avatar">{initials(user?.name)}</div>
          <div className="adm-user-info">
            <div className="adm-user-name">{user?.name}</div>
            <div className="adm-user-role">Super Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="adm-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="adm-nav-group">
              <div className="adm-nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <div
                  key={item.key}
                  className={`adm-nav-item ${tab === item.key ? 'active' : ''}`}
                  onClick={() => { setTab(item.key); setSidebarOpen(false); }}
                >
                  <span className="adm-nav-icon">{item.icon}</span>
                  {item.label}
                  {/* Badges */}
                  {item.key === 'campaigns' && pendingCampaignsCount > 0 && <span className="adm-nav-badge">{pendingCampaignsCount}</span>}
                  {item.key === 'kyc' && pendingKycCount > 0 && <span className="adm-nav-badge">{pendingKycCount}</span>}
                  {item.key === 'withdrawals' && pendingWithdrawals > 0 && <span className="adm-nav-badge">{pendingWithdrawals}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="adm-sidebar-footer">
          <button className="adm-logout-btn" onClick={() => navigate('/')}>
            <span>🏠</span> Back to Site
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">

        {/* Top Bar */}
        <header className="adm-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="adm-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="adm-breadcrumb">
              <span>DonateFate</span>
              <span className="adm-breadcrumb-sep">/</span>
              <span>Admin</span>
              <span className="adm-breadcrumb-sep">/</span>
              <span className="adm-breadcrumb-current">{currentTabLabel}</span>
            </div>
          </div>
          <div className="adm-topbar-right">
            {totalPendingActions > 0 && (
              <div className="adm-topbar-btn" title={`${totalPendingActions} pending actions`}>
                🔔
                <span className="adm-notif-dot" />
              </div>
            )}
            <div className="adm-topbar-avatar" title={user?.name}>{initials(user?.name)}</div>
          </div>
        </header>

        {/* Content */}
        <main className="adm-content">
          {/* Page header */}
          <div className="adm-page-header">
            <h1 className="adm-page-title">{currentTabLabel}</h1>
            <p className="adm-page-subtitle">
              {tab === 'overview' ? `Welcome back, ${user?.name}. Here's your platform summary.` : `Manage your platform's ${currentTabLabel.toLowerCase()}.`}
            </p>
          </div>

          {/* Alert */}
          {message.text && (
            <div className={`adm-alert ${message.type}`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="adm-spinner" />
          ) : (
            <>

              {/* ══ OVERVIEW ══════════════════════════════════════ */}
              {tab === 'overview' && stats && (
                <div className="adm-animate">

                  {/* Stat Cards */}
                  <div className="adm-stats-grid">
                    <div className="adm-stat-card blue">
                      <div className="adm-stat-icon">👥</div>
                      <div className="adm-stat-value">{(stats.users?.total || 0).toLocaleString()}</div>
                      <div className="adm-stat-label">Total Users</div>
                    </div>
                    <div className="adm-stat-card emerald">
                      <div className="adm-stat-icon">💰</div>
                      <div className="adm-stat-value">{fmtMoney(stats.donations?.total_raised)}</div>
                      <div className="adm-stat-label">Total Raised</div>
                    </div>
                    <div className="adm-stat-card rose">
                      <div className="adm-stat-icon">📋</div>
                      <div className="adm-stat-value">{(stats.campaigns?.active || 0).toLocaleString()}</div>
                      <div className="adm-stat-label">Active Campaigns</div>
                    </div>
                    <div className="adm-stat-card amber">
                      <div className="adm-stat-icon">⚡</div>
                      <div className="adm-stat-value">{totalPendingActions}</div>
                      <div className="adm-stat-label">Pending Actions</div>
                    </div>
                  </div>

                  {/* Main grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>

                    {/* Revenue chart */}
                    <div className="adm-chart-card">
                      <div className="adm-chart-title">7-Day Revenue</div>
                      <div className="adm-chart-sub">Daily donation totals</div>
                      {stats.revenueChart?.length ? (() => {
                        const max = Math.max(...stats.revenueChart.map(d => Number(d.total)), 1);
                        return (
                          <div className="adm-bar-chart">
                            {stats.revenueChart.map((day, i) => {
                              const pct = (Number(day.total) / max) * 100;
                              return (
                                <div key={i} className="adm-bar-col">
                                  <div className="adm-bar" style={{ height: `${Math.max(pct, 4)}%` }} data-val={fmtMoney(day.total)} />
                                  <div className="adm-bar-lbl">
                                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() : (
                        <div style={{ color: '#475569', textAlign: 'center', padding: '40px', fontSize: '0.9rem' }}>No revenue data yet.</div>
                      )}
                    </div>

                    {/* Right column: status + quick actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* System status */}
                      <div className="adm-card">
                        <div className="adm-card-header">
                          <span className="adm-card-title">System Status</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10b981', background: '#f0fdf4', padding: '2px 8px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>All OK</span>
                        </div>
                        <div className="adm-card-body" style={{ paddingTop: '14px' }}>
                          <div className="adm-status-list">
                            <div className="adm-status-row">
                              <div className="adm-status-dot ok" />
                              Platform
                              <span className="adm-status-count">●</span>
                            </div>
                            <div className="adm-status-row">
                              <div className={`adm-status-dot ${pendingCampaignsCount > 0 ? 'warn' : 'ok'}`} />
                              Campaigns Review
                              <span className="adm-status-count">{pendingCampaignsCount}</span>
                            </div>
                            <div className="adm-status-row">
                              <div className={`adm-status-dot ${pendingWithdrawals > 0 ? 'warn' : 'ok'}`} />
                              Withdrawals
                              <span className="adm-status-count">{pendingWithdrawals}</span>
                            </div>
                            <div className="adm-status-row">
                              <div className={`adm-status-dot ${pendingKycCount > 0 ? 'warn' : 'ok'}`} />
                              KYC Reviews
                              <span className="adm-status-count">{pendingKycCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="adm-card">
                        <div className="adm-card-header"><span className="adm-card-title">Quick Actions</span></div>
                        <div className="adm-card-body" style={{ paddingTop: '14px' }}>
                          <div className="adm-quick-grid">
                            {[
                              { key: 'campaigns', icon: '📋', label: 'Campaigns' },
                              { key: 'kyc',       icon: '🛡️', label: 'KYC' },
                              { key: 'withdrawals',icon: '💸', label: 'Payouts' },
                              { key: 'users',     icon: '👥', label: 'Users' },
                            ].map(a => (
                              <button key={a.key} className="adm-quick-btn" onClick={() => setTab(a.key)}>
                                <span className="adm-quick-btn-icon">{a.icon}</span>
                                {a.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats row 2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '18px' }}>
                    <div className="adm-card">
                      <div className="adm-card-body" style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366F1', fontFamily: 'var(--font-display)' }}>{stats.campaigns?.total || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Total Campaigns</div>
                      </div>
                    </div>
                    <div className="adm-card">
                      <div className="adm-card-body" style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-display)' }}>{stats.donations?.unique_donors || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Unique Donors</div>
                      </div>
                    </div>
                    <div className="adm-card">
                      <div className="adm-card-body" style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>{fmtMoney(stats.donations?.total_raised)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Platform Revenue</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="adm-card">
                    <div className="adm-card-header">
                      <span className="adm-card-title">Recent Activity</span>
                      <button className="adm-btn secondary sm" onClick={() => setTab('activity')}>View All →</button>
                    </div>
                    <div className="adm-card-body">
                      {activityLog.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No recent activity.</p>
                      ) : (
                        <div className="adm-activity-list">
                          {activityLog.map(log => (
                            <div key={log.id} className="adm-activity-row">
                              <div className={`adm-activity-icon ${log.type}`}>
                                {log.type === 'donation' ? '💰' : log.type === 'campaign' ? '🎯' : log.type === 'user' ? '👤' : '💸'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="adm-activity-text">{log.text}</div>
                                <div className="adm-activity-time">{fmtTime(log.date)}</div>
                              </div>
                              <span className={`adm-activity-tag ${log.type}`}>{log.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ ANALYTICS ═══════════════════════════════════ */}
              {tab === 'analytics' && analytics && (
                <div className="adm-animate">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>

                    {/* Top Campaigns */}
                    <div className="adm-card">
                      <div className="adm-card-header"><span className="adm-card-title">🏆 Top Campaigns</span></div>
                      <div className="adm-card-body">
                        {analytics.topCampaigns?.map((c, i) => {
                          const pct = Math.min(100, (Number(c.current_amount) / Number(c.goal_amount)) * 100);
                          return (
                            <div key={c.id} style={{ marginBottom: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`} {c.title}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>{fmtMoney(c.current_amount)}</span>
                              </div>
                              <div className="adm-progress"><div className="adm-progress-fill" style={{ width: `${pct}%` }} /></div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>{pct.toFixed(0)}% of {fmtMoney(c.goal_amount)}</div>
                            </div>
                          );
                        })}
                        {!analytics.topCampaigns?.length && <div className="adm-empty"><div className="adm-empty-sub">No campaigns yet.</div></div>}
                      </div>
                    </div>

                    {/* Top Donors */}
                    <div className="adm-card">
                      <div className="adm-card-header"><span className="adm-card-title">💎 Top Donors</span></div>
                      <div className="adm-card-body">
                        <div className="adm-table-wrap">
                          <table className="adm-table">
                            <thead><tr><th>#</th><th>Donor</th><th>Total</th></tr></thead>
                            <tbody>
                              {analytics.topDonors?.map((d, i) => (
                                <tr key={i}>
                                  <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                                  <td><strong>{d.name}</strong></td>
                                  <td style={{ color: '#6366F1', fontWeight: 700 }}>{fmtMoney(d.total_donated)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {!analytics.topDonors?.length && <div className="adm-empty"><div className="adm-empty-sub">No donations yet.</div></div>}
                      </div>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="adm-card">
                    <div className="adm-card-header"><span className="adm-card-title">📊 Campaigns by Category</span></div>
                    <div className="adm-card-body">
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {analytics.categoryBreakdown?.map((cat, i) => {
                          const colors = ['#6366F1','#3b82f6','#10b981','#f59e0b','#8b5cf6','#f97316','#0d9488'];
                          const c = colors[i % colors.length];
                          return (
                            <div key={i} style={{ flex: '1 1 180px', padding: '16px', background: `${c}10`, border: `1px solid ${c}30`, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', textTransform: 'capitalize' }}>{cat.category || 'Uncategorized'}</span>
                              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: c }}>{cat.count}</span>
                            </div>
                          );
                        })}
                        {!analytics.categoryBreakdown?.length && <div className="adm-empty-sub">No data.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ ACTIVITY LOG ════════════════════════════════ */}
              {tab === 'activity' && (
                <div className="adm-animate adm-card">
                  <div className="adm-card-header"><span className="adm-card-title">Platform Activity</span></div>
                  <div className="adm-card-body">
                    {activityLog.length === 0 ? (
                      <div className="adm-empty"><div className="adm-empty-icon">🔄</div><div className="adm-empty-title">No activity yet</div><div className="adm-empty-sub">Events will appear here as users interact with the platform.</div></div>
                    ) : (
                      <div className="adm-activity-list">
                        {activityLog.map(log => (
                          <div key={log.id} className="adm-activity-row">
                            <div className={`adm-activity-icon ${log.type}`}>
                              {log.type === 'donation' ? '💰' : log.type === 'campaign' ? '🎯' : log.type === 'user' ? '👤' : '💸'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="adm-activity-text">{log.text}</div>
                              <div className="adm-activity-time">{fmtTime(log.date)}</div>
                            </div>
                            <span className={`adm-activity-tag ${log.type}`}>{log.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ USERS ═══════════════════════════════════════ */}
              {tab === 'users' && (
                <div className="adm-animate">
                  <div className="adm-filters">
                    <div className="adm-search-wrap">
                      <input type="text" placeholder="Search by name or email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="adm-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">All Roles</option>
                      <option value="creator">Creator</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="adm-card">
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>KYC</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length === 0 ? (
                            <tr><td colSpan={7}><div className="adm-empty"><div className="adm-empty-icon">👥</div><div className="adm-empty-title">No users found</div></div></td></tr>
                          ) : filteredUsers.map(u => (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                    {initials(u.name)}
                                  </div>
                                  <strong>{u.name}</strong>
                                </div>
                              </td>
                              <td style={{ color: '#64748b' }}>{u.email}</td>
                              <td><Badge status={u.role} /></td>
                              <td><Badge status={u.kyc_status || 'none'} /> {u.email_verified && <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✅ Verified</span>}</td>
                              <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{fmtDate(u.created_at)}</td>
                              <td>{u.is_banned ? <Badge status="banned" /> : <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Active</span>}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  {!u.email_verified && (
                                    <button className="adm-btn primary xs" onClick={() => handleVerifyUser(u.id, u.name)} disabled={actionLoading === `verify-${u.id}`}>Verify Email</button>
                                  )}
                                  {u.is_banned ? (
                                    <button className="adm-btn success xs" onClick={() => handleUserUnban(u.id, u.name)} disabled={actionLoading === `user-unban-${u.id}`}>Unban</button>
                                  ) : (
                                    <button className="adm-btn danger xs" onClick={() => { setSelectedUserId(u.id); setSelectedUserName(u.name); setShowBanModal(true); }}>Ban</button>
                                  )}
                                  <button className="adm-btn secondary xs" onClick={() => handleOpenAddUserFunds(u.id, u.name)} disabled={!!actionLoading}>💵</button>
                                  <button className="adm-btn danger xs" onClick={() => handleDeleteUser(u.id)} disabled={actionLoading === `user-del-${u.id}`}>🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ CAMPAIGNS ═══════════════════════════════════ */}
              {tab === 'campaigns' && (
                <div className="adm-animate">
                  <div className="adm-filters">
                    <div className="adm-search-wrap">
                      <input type="text" placeholder="Search by title or creator…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="adm-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="paused">Paused</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {filteredCampaigns.length === 0 ? (
                    <div className="adm-card"><div className="adm-empty"><div className="adm-empty-icon">📋</div><div className="adm-empty-title">No campaigns found</div><div className="adm-empty-sub">Try adjusting your filter.</div></div></div>
                  ) : filteredCampaigns.map(c => {
                    const pct = Math.min(100, (Number(c.current_amount) / Number(c.goal_amount)) * 100);
                    return (
                      <div key={c.id} className="adm-campaign-card">
                        <div className="adm-campaign-thumb">
                          {c.cover_image_url ? <img src={c.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : '📋'}
                        </div>
                        <div className="adm-campaign-info">
                          <div className="adm-campaign-title">{c.title}</div>
                          <div className="adm-campaign-meta">
                            By <strong>{c.creator_name || 'Unknown'}</strong> · {fmtDate(c.created_at)} · {fmtMoney(c.current_amount)} / {fmtMoney(c.goal_amount)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 120px' }}>
                              <div className="adm-progress" style={{ width: '120px' }}><div className="adm-progress-fill" style={{ width: `${pct}%` }} /></div>
                            </div>
                            <Badge status={c.status} />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SEO: {c.seo_visible ? '✅' : '🚫'}</span>
                          </div>
                        </div>
                        <div className="adm-campaign-actions">
                          {c.status === 'pending' && (
                            <>
                              <button className="adm-btn success sm" onClick={() => handleCampaignAction(c.id, 'approve')} disabled={actionLoading === c.id}>✓ Approve</button>
                              <button className="adm-btn danger sm" onClick={() => handleCampaignAction(c.id, 'reject')} disabled={actionLoading === c.id}>✕ Reject</button>
                            </>
                          )}
                          {(c.status === 'active' || c.status === 'paused') && (
                            <button className="adm-btn secondary sm" onClick={() => handleToggleCampaign(c.id)} disabled={!!actionLoading}>
                              {c.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                            </button>
                          )}
                          <button className="adm-btn ghost sm" onClick={() => handleToggleSeo(c.id)} disabled={!!actionLoading}>
                            {c.seo_visible ? '🚫 SEO' : '✅ SEO'}
                          </button>
                          <button className="adm-btn secondary sm" onClick={() => handleAddFunds(c.id, c.title)} disabled={!!actionLoading}>💵</button>
                          <button className="adm-btn danger sm" onClick={() => handleDeleteCampaign(c.id)} disabled={actionLoading === `del-${c.id}`}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ KYC ════════════════════════════════════════ */}
              {tab === 'kyc' && (
                <div className="adm-animate">
                  {kycList.length === 0 ? (
                    <div className="adm-card"><div className="adm-empty"><div className="adm-empty-icon">🛡️</div><div className="adm-empty-title">No KYC submissions</div><div className="adm-empty-sub">KYC submissions will appear here.</div></div></div>
                  ) : kycList.map(k => (
                    <div key={k.id} className="adm-card" style={{ marginBottom: '14px' }}>
                      <div className="adm-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <strong style={{ color: '#0f172a' }}>{k.user_name}</strong>
                              <Badge status={k.kyc_status} />
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>{k.user_email}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Submitted: {fmtTime(k.submitted_at)}</div>
                            {k.document_url && (
                              <button className="adm-btn secondary sm" style={{ marginTop: '10px' }} onClick={() => setPreviewDocument(k.document_url)}>
                                📄 View Document
                              </button>
                            )}
                          </div>
                          {k.kyc_status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="adm-btn success" onClick={() => handleKycAction(k.id, 'approve')} disabled={actionLoading === `kyc-${k.id}`}>✓ Approve</button>
                              <button className="adm-btn danger" onClick={() => handleKycAction(k.id, 'reject')} disabled={actionLoading === `kyc-${k.id}`}>✕ Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ WITHDRAWALS ═════════════════════════════════ */}
              {tab === 'withdrawals' && (
                <div className="adm-animate">
                  {withdrawals.length === 0 ? (
                    <div className="adm-card"><div className="adm-empty"><div className="adm-empty-icon">💸</div><div className="adm-empty-title">No pending withdrawals</div><div className="adm-empty-sub">All clear!</div></div></div>
                  ) : withdrawals.map(w => (
                    <div key={w.id} className="adm-card" style={{ marginBottom: '14px' }}>
                      <div className="adm-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{fmtMoney(w.amount)}</strong>
                              <Badge status={w.status} />
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              Campaign: <strong>{w.campaign_title}</strong> · Creator: {w.creator_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{fmtTime(w.created_at)}</div>
                            {w.payment_method && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Method: {w.payment_method}</div>}
                          </div>
                          {w.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button className="adm-btn success" onClick={() => handleWithdrawalAction(w.id, 'approve', 'stripe')} disabled={actionLoading === w.id}>⚡ Auto-Pay</button>
                              <button className="adm-btn secondary" onClick={() => handleWithdrawalAction(w.id, 'approve', 'manual')} disabled={actionLoading === w.id}>✓ Manual</button>
                              <button className="adm-btn danger" onClick={() => handleWithdrawalAction(w.id, 'reject')} disabled={actionLoading === w.id}>✕ Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ DONATIONS ═══════════════════════════════════ */}
              {tab === 'donations' && (
                <div className="adm-animate">
                  {/* Verify banner */}
                  <div className="adm-card" style={{ marginBottom: '18px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac' }}>
                    <div className="adm-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#166534', marginBottom: '2px' }}>🔍 Verify Pending Payments</div>
                        <div style={{ fontSize: '0.82rem', color: '#15803d' }}>Cross-check Stripe and auto-confirm paid donations.</div>
                        {verifyResult && (
                          <div style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
                            <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.85rem' }}>✅ {verifyResult.verified} verified</span>
                            <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>❌ {verifyResult.failed} failed</span>
                          </div>
                        )}
                      </div>
                      <button
                        className="adm-btn success"
                        style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                        disabled={verifyLoading}
                        onClick={async () => {
                          setVerifyLoading(true); setVerifyResult(null);
                          try {
                            const res = await adminAPI.verifyPendingDonations();
                            setVerifyResult(res.data);
                            setMessage({ type: 'success', text: res.data.message });
                            const fresh = await adminAPI.getDonations(); setDonations(fresh.data.data);
                          } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Verification failed.' }); }
                          finally { setVerifyLoading(false); }
                        }}
                      >{verifyLoading ? '⏳ Verifying…' : '✅ Verify Now'}</button>
                    </div>
                  </div>

                  <div className="adm-filters">
                    <div className="adm-search-wrap">
                      <input type="text" placeholder="Search by campaign or donor…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="adm-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button className="adm-btn secondary" onClick={exportDonationsCSV}>📥 Export CSV</button>
                  </div>

                  <div className="adm-card">
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Campaign</th>
                            <th>Donor</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDonations.length === 0 ? (
                            <tr><td colSpan={6}><div className="adm-empty"><div className="adm-empty-icon">💳</div><div className="adm-empty-title">No donations found</div></div></td></tr>
                          ) : filteredDonations.map(d => (
                            <tr key={d.id}>
                              <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{fmtTime(d.created_at)}</td>
                              <td><strong>{d.campaign_title}</strong></td>
                              <td style={{ color: '#64748b' }}>{d.is_anonymous ? 'Anonymous' : (d.donor_user_name || d.guest_name || 'Guest')}</td>
                              <td style={{ fontWeight: 700, color: '#10b981' }}>{fmtMoney(d.amount)}</td>
                              <td><Badge status={d.status} /></td>
                              <td style={{ textAlign: 'right' }}>
                                <button className="adm-btn danger xs" onClick={() => handleDeleteDonation(d.id)} disabled={actionLoading === `del-don-${d.id}`}>🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ BROADCAST ═══════════════════════════════════ */}
              {tab === 'broadcast' && (
                <div className="adm-animate" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '18px', alignItems: 'start' }}>
                  <div className="adm-card">
                    <div className="adm-card-header"><span className="adm-card-title">📧 Compose Broadcast</span></div>
                    <div className="adm-card-body">
                      <div className="adm-form-group">
                        <label className="adm-label">Audience</label>
                        <select className="adm-select" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                          <option value="all_users">All Users</option>
                          <option value="creators">Creators Only</option>
                          <option value="donors">Donors Only</option>
                          <option value="selected">Selected Users</option>
                        </select>
                      </div>
                      <div className="adm-form-group">
                        <label className="adm-label">Subject Line</label>
                        <input className="adm-input" placeholder="e.g. Important Update from DonateFate" value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} />
                      </div>
                      <div className="adm-form-group">
                        <label className="adm-label">Email Body (HTML)</label>
                        <ReactQuill
                          theme="snow"
                          value={broadcastContent}
                          onChange={setBroadcastContent}
                          style={{ background: '#fff', borderRadius: '9px', marginBottom: '0' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button className="adm-btn primary" onClick={handleSendBroadcast} disabled={actionLoading === 'broadcast'}>
                          {actionLoading === 'broadcast' ? '⏳ Sending…' : '🚀 Send Broadcast'}
                        </button>
                        <button className="adm-btn secondary" onClick={handleTestEmail} disabled={actionLoading === 'test-email'}>
                          🧪 Test Email
                        </button>
                        <button className="adm-btn ghost" onClick={handleExportEmails} disabled={actionLoading === 'export'}>
                          📥 Export CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {broadcastTarget === 'selected' && (
                    <div className="adm-card">
                      <div className="adm-card-header"><span className="adm-card-title">Select Recipients</span></div>
                      <div className="adm-card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {usersList.map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                            <input type="checkbox" checked={broadcastSelectedUsers.includes(u.id)} onChange={() => setBroadcastSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ SETTINGS ════════════════════════════════════ */}
              {tab === 'settings' && (
                <div className="adm-animate" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'start' }}>

                  {/* Platform Settings */}
                  <div className="adm-card">
                    <div className="adm-card-header"><span className="adm-card-title">⚙️ Platform Settings</span></div>
                    <div className="adm-card-body">
                      {settings.filter(s => !s.setting_key.startsWith('page_')).map(s => (
                        <SettingField key={s.setting_key} setting={s} onSave={handleSettingUpdate} />
                      ))}
                    </div>
                  </div>

                  {/* Page Content Editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="adm-card">
                      <div className="adm-card-header"><span className="adm-card-title">📄 Page Content Editor</span></div>
                      <div className="adm-card-body">
                        <div className="adm-form-group">
                          <label className="adm-label">Page</label>
                          <select className="adm-select" value={selectedPage} onChange={e => setSelectedPage(e.target.value)}>
                            {settings.filter(s => s.setting_key.startsWith('page_')).map(s => (
                              <option key={s.setting_key} value={s.setting_key}>
                                {s.setting_key.replace('page_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </div>
                        <ReactQuill theme="snow" value={pageContent} onChange={setPageContent} style={{ background: '#fff', borderRadius: '9px' }} />
                        <button className="adm-btn primary" style={{ marginTop: '14px' }} onClick={handlePageSave} disabled={actionLoading === 'save-page'}>
                          {actionLoading === 'save-page' ? '⏳ Saving…' : '💾 Save Page'}
                        </button>
                      </div>
                    </div>

                    {/* Admin Profile */}
                    <div className="adm-card">
                      <div className="adm-card-header"><span className="adm-card-title">👤 Admin Profile</span></div>
                      <div className="adm-card-body">
                        <form onSubmit={handleProfileUpdate}>
                          <div className="adm-form-group">
                            <label className="adm-label">Email Address</label>
                            <input className="adm-input" type="email" value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} />
                          </div>
                          <div className="adm-form-group">
                            <label className="adm-label">Current Password</label>
                            <input className="adm-input" type="password" placeholder="Enter current password" value={profileData.currentPassword} onChange={e => setProfileData(p => ({ ...p, currentPassword: e.target.value }))} />
                          </div>
                          <div className="adm-form-group">
                            <label className="adm-label">New Password</label>
                            <input className="adm-input" type="password" placeholder="Leave blank to keep current" value={profileData.newPassword} onChange={e => setProfileData(p => ({ ...p, newPassword: e.target.value }))} />
                          </div>
                          <button type="submit" className="adm-btn primary" disabled={profileLoading}>{profileLoading ? '⏳ Saving…' : '💾 Update Profile'}</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </main>
      </div>

      {/* ── Ban Modal ── */}
      {showBanModal && (
        <div className="adm-modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">🚫 Ban User — {selectedUserName}</span>
              <button className="adm-modal-close" onClick={() => setShowBanModal(false)}>×</button>
            </div>
            <form onSubmit={handleUserBan}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-label">Ban Type</label>
                  <select className="adm-select" value={banForm.ban_type} onChange={e => setBanForm(f => ({ ...f, ban_type: e.target.value }))}>
                    <option value="temporary">Temporary</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                {banForm.ban_type === 'temporary' && (
                  <div className="adm-form-group">
                    <label className="adm-label">Duration (days)</label>
                    <input className="adm-input" type="number" min={1} value={banForm.duration_days} onChange={e => setBanForm(f => ({ ...f, duration_days: e.target.value }))} />
                  </div>
                )}
                <div className="adm-form-group">
                  <label className="adm-label">Reason</label>
                  <input className="adm-input" placeholder="Reason for ban (shown to user)" value={banForm.reason} onChange={e => setBanForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn ghost" onClick={() => setShowBanModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn danger" disabled={actionLoading === `user-ban-${selectedUserId}`}>
                  {actionLoading === `user-ban-${selectedUserId}` ? '⏳ Banning…' : '🚫 Ban User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Adjust Balance Modal ── */}
      {addFundsModal.open && (
        <div className="adm-modal-overlay" onClick={() => setAddFundsModal(p => ({ ...p, open: false }))}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">💵 Adjust Balance — {addFundsModal.userName}</span>
              <button className="adm-modal-close" onClick={() => setAddFundsModal(p => ({ ...p, open: false }))}>×</button>
            </div>
            <form onSubmit={submitAddUserFunds}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', border: `2px solid ${addFundsModal.actionType === 'add' ? '#10b981' : '#e2e8f0'}`, borderRadius: '9px' }}>
                      <input type="radio" name="at" value="add" checked={addFundsModal.actionType === 'add'} onChange={() => setAddFundsModal(p => ({ ...p, actionType: 'add' }))} />
                      <strong style={{ color: '#10b981' }}>➕ Add Funds</strong>
                    </label>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', border: `2px solid ${addFundsModal.actionType === 'subtract' ? '#ef4444' : '#e2e8f0'}`, borderRadius: '9px' }}>
                      <input type="radio" name="at" value="subtract" checked={addFundsModal.actionType === 'subtract'} onChange={() => setAddFundsModal(p => ({ ...p, actionType: 'subtract' }))} />
                      <strong style={{ color: '#ef4444' }}>➖ Subtract</strong>
                    </label>
                  </div>
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Campaign (optional)</label>
                  <select className="adm-select" value={addFundsModal.selectedCampaign} onChange={e => setAddFundsModal(f => ({ ...f, selectedCampaign: e.target.value }))}>
                    <option value="">-- Auto-create adjustment campaign --</option>
                    {addFundsModal.campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Amount (USD)</label>
                  <input className="adm-input" type="number" step="0.01" min="0.01" placeholder="e.g. 50.00" value={addFundsModal.amount} onChange={e => setAddFundsModal(f => ({ ...f, amount: e.target.value }))} required />
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn ghost" onClick={() => setAddFundsModal(p => ({ ...p, open: false }))}>Cancel</button>
                <button
                  type="submit"
                  className="adm-btn"
                  style={{ background: addFundsModal.actionType === 'add' ? '#10b981' : '#ef4444', color: '#fff', border: 'none' }}
                  disabled={actionLoading === `user-funds-${addFundsModal.userId}`}
                >
                  {actionLoading === `user-funds-${addFundsModal.userId}` ? '⏳ Processing…' : addFundsModal.actionType === 'add' ? 'Add Funds' : 'Subtract Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDocument && (
        <div className="adm-modal-overlay" onClick={() => setPreviewDocument(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <strong style={{ fontFamily: 'var(--font-display)', color: '#0f172a' }}>📄 Document Preview</strong>
              <button className="adm-btn secondary sm" onClick={() => setPreviewDocument(null)}>Close ×</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
              {previewDocument.startsWith('data:application/pdf') ? (
                <iframe src={previewDocument} width="100%" height="600px" style={{ border: 'none' }} title="PDF Preview" />
              ) : (
                <img src={previewDocument} alt="KYC Document" style={{ maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
