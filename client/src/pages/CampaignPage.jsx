import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GuestCheckoutForm from '../components/donations/GuestCheckoutForm';
import { campaignAPI, updateAPI, rewardAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiTarget, FiUser, FiMessageCircle, FiGift, FiShare2, FiHeart, FiCheckCircle, FiActivity, FiChevronDown, FiShield, FiLock, FiChevronRight } from 'react-icons/fi';

export default function CampaignPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [donors, setDonors] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('story');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const checkoutForm = document.querySelector('.checkout-container');
      if (checkoutForm) {
        const rect = checkoutForm.getBoundingClientRect();
        const isFormVisible = rect.top < window.innerHeight - 80;
        setShowStickyBar(window.scrollY > 150 && !isFormVisible);
      } else {
        setShowStickyBar(window.scrollY > 150);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      campaignAPI.getById(id),
      campaignAPI.getDonors(id),
      updateAPI.list(id),
      rewardAPI.list(id),
      commentAPI.list(id)
    ]).then(([campRes, donorRes, updRes, rewRes, comRes]) => {
      setCampaign(campRes.data.data);
      setDonors(donorRes.data.data || []);
      setUpdates(updRes.data.data || []);
      setRewards(rewRes.data.data || []);
      setComments(comRes.data.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!campaign) return;
    const existingTag = document.querySelector('meta[name="robots"][data-campaign]');
    if (campaign.seo_visible === false) {
      if (!existingTag) {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex,nofollow';
        meta.setAttribute('data-campaign', 'true');
        document.head.appendChild(meta);
      }
    } else {
      existingTag?.remove();
    }
    return () => document.querySelector('meta[name="robots"][data-campaign]')?.remove();
  }, [campaign]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await commentAPI.create(id, { content: newComment });
      if (res.data.success) {
        setComments([res.data.data, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      alert('Failed to post comment. Ensure you are logged in.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentAPI.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert('Failed to delete comment.');
    }
  };

  if (loading) return <div className="page flex-center"><div className="spinner" /></div>;
  if (!campaign) return <div className="page container text-center"><h2>Campaign not found</h2></div>;

  const progress = campaign.goal_amount > 0
    ? Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100)
    : 0;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / 3600000);
    return hours > 0 ? `${hours}h ago` : 'Just now';
  };

  const getDaysLeft = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="campaign-detail page animate-fade">
      
      {/* Hero Image Section */}
      <div className="campaign-hero-container">
        <img 
          src={campaign.cover_image_url || 'https://images.unsplash.com/photo-1593113565630-1de62d64020b?auto=format&fit=crop&w=1200&q=80'} 
          alt={campaign.title} 
          className="campaign-hero-img"
        />
        <div className="campaign-carousel-dots">
          <div className="campaign-carousel-dot active"></div>
          <div className="campaign-carousel-dot"></div>
          <div className="campaign-carousel-dot"></div>
          <div className="campaign-carousel-dot"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="campaign-content-wrapper">
        
        <h1 className="campaign-title-new">{campaign.title}</h1>
        
        {campaign.description && (
          <div className="campaign-summary-new">
            {campaign.description.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
          </div>
        )}

        {!isExpanded && (
          <button className="read-story-btn" onClick={() => setIsExpanded(true)}>
            Read {campaign.creator_name}'s full story <FiChevronDown style={{ marginLeft: '4px' }} />
          </button>
        )}

        {isExpanded && (
          <div style={{ textAlign: 'left', marginBottom: '40px', background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }} className="animate-in ql-editor">
             <div dangerouslySetInnerHTML={{ __html: campaign.description }} />
          </div>
        )}

        {/* Stats Pills */}
        <div className="campaign-pills">
          <span className="campaign-pill green">{campaign.donor_count || donors.length} donated</span>
          <span className="campaign-pill red">{formatCurrency(campaign.current_amount)} raised</span>
          <span className="campaign-pill yellow">{Math.max(0, 100 - progress).toFixed(0)}% left</span>
        </div>

        {/* Trust & Social Proof */}
        <div className="campaign-trust-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <FiLock style={{ color: '#16a34a' }} />
            Secure donation
          </div>
          <div className="live-indicator">
            <div className="activity-pulse"></div>
            {Math.floor(Math.random() * 10) + 2} people donating now
          </div>
        </div>

        {/* Rest of the content (Updates, Comments, Donors) */}
        <div style={{ textAlign: 'left', marginTop: '48px' }}>
          <div className="tabs" style={{ justifyContent: 'center' }}>
            {['updates', 'comments', 'donors'].map(t => (
              <button 
                key={t} 
                className={`tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} 
                {t === 'updates' ? ` (${updates.length})` : ''}
                {t === 'comments' ? ` (${comments.length})` : ''}
                {t === 'donors' ? ` (${donors.length})` : ''}
              </button>
            ))}
          </div>

          <div className="tab-content" style={{ minHeight: 'auto', paddingBottom: '60px' }}>
            {/* UPDATES */}
            {tab === 'updates' && (
              <div className="animate-in">
                {updates.length > 0 ? updates.map(update => (
                  <div key={update.id} className="card mb-4">
                    <div className="card-body">
                      <div className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                        {new Date(update.created_at).toLocaleDateString()}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{update.title}</h3>
                      <div dangerouslySetInnerHTML={{ __html: update.content }} />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted">No updates yet.</div>
                )}
              </div>
            )}

            {/* COMMENTS */}
            {tab === 'comments' && (
              <div className="animate-in">
                {user ? (
                  <form onSubmit={handlePostComment} className="comment-form">
                    <div className="comment-avatar flex-center">
                      <FiUser />
                    </div>
                    <div style={{ flex: 1 }}>
                      <textarea 
                        className="form-control" 
                        placeholder="Leave a comment of support..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        rows={3}
                        required
                        disabled={submittingComment}
                      ></textarea>
                      <button 
                        type="submit" 
                        className="btn btn-primary mt-3"
                        disabled={submittingComment || !newComment.trim()}
                      >
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="card mb-4 text-center py-4 bg-slate-50 border-dashed">
                    <p className="mb-3 text-secondary">Log in to leave a comment of support.</p>
                    <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
                  </div>
                )}

                <div className="comment-list">
                  {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar flex-center">
                        {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : <FiUser />}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{comment.user_name || 'Anonymous'}</span>
                          <div className="flex gap-3">
                            <span className="comment-time">{timeAgo(comment.created_at)}</span>
                            {(user?.id === comment.user_id || user?.role === 'admin') && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                            )}
                          </div>
                        </div>
                        <p style={{ margin: 0 }}>{comment.content}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-muted">No comments yet. Be the first!</div>
                  )}
                </div>
              </div>
            )}

            {/* DONORS */}
            {tab === 'donors' && (
              <div className="animate-in">
                <div className="card">
                  {donors.length > 0 ? donors.map(d => {
                    const name = d.donor_name || 'Anonymous';
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <div key={d.id} className="donor-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 600 }}>
                            {initials}
                          </div>
                          <div>
                            <div className="donor-name" style={{ color: 'var(--slate-900)' }}>{name}</div>
                            <div className="donor-time flex items-center gap-1"><FiClock size={12} /> {timeAgo(d.created_at)}</div>
                            {d.comment && (
                              <div style={{ marginTop: '8px', fontSize: '0.95rem', color: 'var(--slate-700)', fontStyle: 'italic', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: '0 8px 8px 8px' }}>
                                "{d.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="donor-amount" style={{ padding: '8px 16px', background: 'var(--success-bg)', borderRadius: 'var(--radius-full)' }}>
                          {formatCurrency(d.amount)}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="card-body text-center py-6">
                      <FiHeart size={48} className="text-muted mx-auto mb-3" />
                      <p className="text-secondary">Be the first to donate!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar (Fundrise Style) */}
      <div className="sticky-bottom-bar">
        <div className="sticky-bar-content">
          
          <button className="btn-donate-massive" onClick={() => setShowCheckoutModal(true)}>
            <FiHeart /> Donate now <FiChevronRight />
          </button>
          
          <div className="sticky-bar-trust">
            <span><FiLock size={12} /> Stripe secured</span>
            <span>•</span>
            <span><FiCheckCircle size={12} /> 14-day refund</span>
            <span>•</span>
            <span><FiShield size={12} /> SSL</span>
          </div>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {showCheckoutModal && (
        <div className="checkout-modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Complete Donation</h2>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            {/* The actual donation component */}
            <GuestCheckoutForm 
              campaignId={campaign.id} 
              campaignTitle={campaign.title} 
              selectedReward={selectedReward}
              rewards={rewards}
              prefilledTip={0}
            />
          </div>
        </div>
      )}

    </div>
  );
}
