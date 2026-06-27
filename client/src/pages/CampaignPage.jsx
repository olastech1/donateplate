import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GuestCheckoutForm from '../components/donations/GuestCheckoutForm';
import { campaignAPI, updateAPI, rewardAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiTarget, FiUser, FiMessageCircle, FiGift, FiShare2, FiHeart } from 'react-icons/fi';

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
      setDonors(donorRes.data.data);
      setUpdates(updRes.data.data);
      setRewards(rewRes.data.data);
      setComments(comRes.data.data);
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
    <div className="campaign-detail">
      <div className="container">
        
        {/* Campaign Hero Image */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <img 
            src={campaign.cover_image_url || 'https://via.placeholder.com/1200x500?text=DonatePlate'} 
            alt={campaign.title} 
            className="campaign-hero-img"
          />
          <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px' }}>
            <span className="badge badge-category" style={{ background: 'var(--bg-glass-strong)', backdropFilter: 'blur(10px)' }}>
              {campaign.category}
            </span>
            {campaign.status === 'active' && (
              <span className="badge badge-success" style={{ background: 'rgba(20, 184, 166, 0.9)', color: '#fff' }}>
                Active
              </span>
            )}
          </div>
        </div>

        {/* Campaign Content Layout */}
        <div className="campaign-layout">
          {/* Left Column (Content) */}
          <div>
            <h1 className="campaign-title">{campaign.title}</h1>
            
            <div className="campaign-meta">
              <Link to={`/profile/${campaign.creator_id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-warm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {campaign.creator_name.charAt(0).toUpperCase()}
                </div>
                {campaign.creator_name}
              </Link>
              <span className="text-muted">•</span>
              <span className="text-muted">Launched {new Date(campaign.created_at).toLocaleDateString()}</span>
            </div>

            {/* Mobile-only Progress (hidden on desktop, handled by sticky bar/donate box) */}
            <div className="mobile-only" style={{ margin: '24px 0', display: 'none' /* Will use media queries in real CSS, hiding for now as per design */ }}>
            </div>

            {/* Tabs */}
            <div className="tabs mt-4">
              {['story', 'rewards', 'updates', 'comments', 'donors'].map(t => (
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

            {/* Tab Content */}
            <div className="tab-content" style={{ minHeight: '400px' }}>
              
              {/* STORY TAB */}
              {tab === 'story' && (
                <div className="animate-fade">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {campaign.description && campaign.description.length > 500 && !isExpanded ? (
                      <>
                        {campaign.description.slice(0, 500)}...
                        <div className="mt-3">
                          <button onClick={() => setIsExpanded(true)} className="btn btn-outline btn-sm">
                            Read Full Story
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {campaign.description}
                        {campaign.description && campaign.description.length > 500 && (
                          <div className="mt-3">
                            <button onClick={() => setIsExpanded(false)} className="btn btn-ghost btn-sm">
                              Show Less
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Rewards preview at bottom of story */}
                  {rewards.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Featured Rewards</h3>
                      <div className="grid grid-2">
                        {rewards.slice(0, 2).map(reward => (
                          <div key={reward.id} className="reward-card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedReward(reward); document.querySelector('.checkout-container')?.scrollIntoView({ behavior: 'smooth' }); }}>
                            <div className="reward-amount">{formatCurrency(reward.min_amount)}</div>
                            <div className="reward-title mt-1">{reward.title}</div>
                            <p className="reward-description mt-1" style={{ fontSize: '0.85rem' }}>
                              {reward.description?.length > 60 ? reward.description.slice(0, 60) + '...' : reward.description}
                            </p>
                          </div>
                        ))}
                      </div>
                      {rewards.length > 2 && (
                         <button onClick={() => setTab('rewards')} className="btn btn-ghost mt-2">View all {rewards.length} rewards</button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* REWARDS TAB */}
              {tab === 'rewards' && (
                <div className="reward-section animate-fade mt-0">
                  {rewards.length > 0 ? rewards.map(reward => (
                    <div key={reward.id} className="reward-card" onClick={() => { setSelectedReward(reward); document.querySelector('.checkout-container')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer', display: 'flex', gap: '20px' }}>
                      {reward.image_url && (
                        <div style={{ width: '120px', height: '120px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                          <img src={reward.image_url} alt={reward.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div className="reward-amount">{formatCurrency(reward.min_amount)} or more</div>
                        <div className="reward-title mt-1">{reward.title}</div>
                        <p className="reward-description">{reward.description}</p>
                        <div className="reward-meta">
                          {reward.max_claims && (
                            <span className="badge badge-category">
                              {reward.claimed_count} / {reward.max_claims} claimed
                              {reward.claimed_count >= reward.max_claims && ' (SOLD OUT)'}
                            </span>
                          )}
                          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>Select this reward &rarr;</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted text-center" style={{ padding: '40px' }}>No reward tiers available for this campaign.</p>
                  )}
                </div>
              )}

              {/* COMMENTS TAB */}
              {tab === 'comments' && (
                <div className="comment-section animate-fade mt-0">
                  
                  {user ? (
                    <form className="comment-form card card-body mb-4" onSubmit={handlePostComment}>
                      <div className="comment-avatar">{user.name.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <textarea
                          className="form-textarea"
                          placeholder="Leave a comment or question..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          style={{ minHeight: '80px', marginBottom: '12px' }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={submittingComment || !newComment.trim()}>
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="alert alert-info mb-4">
                      Please <Link to="/login" style={{ textDecoration: 'underline' }}>log in</Link> to leave a comment.
                    </div>
                  )}

                  <div className="comments-list">
                    {comments.length > 0 ? comments.map(c => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-avatar">
                          {c.author_avatar ? <img src={c.author_avatar} alt={c.author_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : c.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="comment-body">
                          <div className="comment-header">
                            <span className="comment-author">{c.author_name}</span>
                            {c.author_role === 'admin' && <span className="badge badge-purple" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Admin</span>}
                            {c.user_id === campaign.creator_id && <span className="badge badge-accent" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Creator</span>}
                            <span className="comment-time">{timeAgo(c.created_at)}</span>
                          </div>
                          <div className="comment-content">{c.content}</div>
                          
                          {/* Replies and Actions could go here */}
                          {(user && (user.role === 'admin' || user.id === c.user_id)) && (
                            <div className="comment-actions">
                              <button className="comment-action-btn" onClick={() => handleDeleteComment(c.id)}>Delete</button>
                            </div>
                          )}

                          {/* Nested Replies */}
                          {c.replies && c.replies.length > 0 && (
                            <div className="comment-replies mt-3">
                              {c.replies.map(r => (
                                <div key={r.id} className="comment-item" style={{ padding: '12px 0' }}>
                                  <div className="comment-avatar" style={{ width: '30px', height: '30px', fontSize: '0.75rem' }}>
                                    {r.author_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="comment-body">
                                    <div className="comment-header">
                                      <span className="comment-author">{r.author_name}</span>
                                      <span className="comment-time">{timeAgo(r.created_at)}</span>
                                    </div>
                                    <div className="comment-content" style={{ fontSize: '0.9rem' }}>{r.content}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted text-center" style={{ padding: '40px' }}>No comments yet. Be the first to start the conversation!</p>
                    )}
                  </div>
                </div>
              )}

              {/* UPDATES TAB */}
              {tab === 'updates' && (
                <div className="animate-fade">
                  {updates.length > 0 ? updates.map(u => (
                    <div key={u.id} className="card mb-3">
                      <div className="card-body">
                        {u.title && <h4 className="mb-1">{u.title}</h4>}
                        <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                          <FiClock style={{ display: 'inline', marginRight: '4px' }} /> {new Date(u.created_at).toLocaleDateString()}
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>{u.message}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted text-center" style={{ padding: '40px' }}>No updates posted yet.</p>
                  )}
                </div>
              )}

              {/* DONORS TAB */}
              {tab === 'donors' && (
                <div className="animate-fade">
                  <div className="card card-body mb-4" style={{ textAlign: 'center', background: 'var(--gradient-hero)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--slate-800)' }}>
                      {campaign.donor_count || donors.length} Supporters
                    </h3>
                    <p className="text-muted">Thank you to everyone who has served generosity.</p>
                  </div>

                  {donors.length > 0 ? donors.map(d => {
                    const name = d.donor_name || 'Anonymous';
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <div key={d.id} className="donor-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div className="profile-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem', boxShadow: 'none' }}>
                            {initials}
                          </div>
                          <div>
                            <div className="donor-name">{name}</div>
                            <div className="donor-time">{timeAgo(d.created_at)}</div>
                            {d.comment && (
                              <div style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                "{d.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="donor-amount">{formatCurrency(d.amount)}</div>
                      </div>
                    );
                  }) : (
                    <p className="text-muted text-center" style={{ padding: '40px' }}>Be the first to donate!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Sticky Donation Sidebar) */}
          <div className="checkout-container">
            <div style={{ position: 'sticky', top: '92px' }}>
              
              {/* Progress Summary Box */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="progress-track mb-3">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  
                  <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--slate-800)', lineHeight: 1 }}>
                    {formatCurrency(campaign.current_amount)}
                  </div>
                  <div className="text-muted mt-1 mb-3">
                    raised of {formatCurrency(campaign.goal_amount)} goal
                  </div>
                  
                  <div className="grid grid-2 mb-4" style={{ gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--slate-800)' }}>{campaign.donor_count || donors.length}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>Donations</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--slate-800)' }}>{getDaysLeft(campaign.end_date)}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>Days Left</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Campaign link copied to clipboard!');
                      }}
                      className="btn btn-secondary" style={{ flex: 1 }}
                    >
                      <FiShare2 /> Share
                    </button>
                    <button 
                      onClick={() => {
                        if (user) { /* Logic to save/follow campaign */ alert('Saved to favorites!'); } 
                        else { alert('Please log in to save campaigns.'); }
                      }}
                      className="btn btn-secondary" style={{ width: '48px', padding: 0 }}
                      aria-label="Save Campaign"
                    >
                      <FiHeart />
                    </button>
                  </div>
                </div>
              </div>

              {/* The Checkout Form */}
              <GuestCheckoutForm 
                campaignId={campaign.id} 
                campaignTitle={campaign.title} 
                selectedReward={selectedReward}
                rewards={rewards}
              />
              
              {selectedReward && (
                <div className="text-center mt-2">
                   <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReward(null)}>Clear Reward Selection</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sticky CTA Bar */}
        <div className={`mobile-sticky-bar ${showStickyBar ? 'visible' : ''}`}>
          <div className="flex-between mb-2">
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--slate-800)' }}>
                {formatCurrency(campaign.current_amount)}
              </div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                of {formatCurrency(campaign.goal_amount)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>{getDaysLeft(campaign.end_date)} days</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>left</div>
            </div>
          </div>
          <div className="progress-track mb-3" style={{ height: '6px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <button 
            onClick={() => document.querySelector('.checkout-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="btn btn-primary btn-block btn-lg"
          >
            Donate Now
          </button>
        </div>

      </div>
    </div>
  );
}
