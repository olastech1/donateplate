import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GuestCheckoutForm from '../components/donations/GuestCheckoutForm';
import { campaignAPI, updateAPI, rewardAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiTarget, FiUser, FiMessageCircle, FiGift, FiShare2, FiHeart, FiCheckCircle } from 'react-icons/fi';

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
      <div className="container">
        
        {/* Campaign Hero Image */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <img 
            src={campaign.cover_image_url || 'https://images.unsplash.com/photo-1593113565630-1de62d64020b?auto=format&fit=crop&w=1200&q=80'} 
            alt={campaign.title} 
            className="campaign-hero-img"
          />
          <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px' }}>
            <span className="badge badge-category card-glass">
              {campaign.category.replace('_', ' ').toUpperCase()}
            </span>
            {campaign.status === 'active' && (
              <span className="badge badge-success">
                <FiCheckCircle style={{ marginRight: '4px' }} /> Active
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
              <Link to={`/profile/${campaign.creator_id}`} className="flex-center" style={{ gap: '12px', color: 'var(--slate-800)', fontWeight: 600 }}>
                <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', border: 'none' }}>
                  {campaign.creator_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ lineHeight: 1.2 }}>{campaign.creator_name}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Campaign Organizer</div>
                </div>
              </Link>
              <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
              <span className="text-muted">Launched {new Date(campaign.created_at).toLocaleDateString()}</span>
            </div>

            {/* Tabs */}
            <div className="tabs">
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
            <div className="tab-content">
              
              {/* STORY TAB */}
              {tab === 'story' && (
                <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                  <div className="ql-editor">
                    {campaign.description && campaign.description.length > 500 && !isExpanded ? (
                      <>
                        <p>{campaign.description.slice(0, 500)}...</p>
                        <div className="mt-3">
                          <button onClick={() => setIsExpanded(true)} className="btn btn-outline btn-sm">
                            Read Full Story
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>{campaign.description}</p>
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
                    <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Featured Rewards</h3>
                      <div className="grid grid-2">
                        {rewards.slice(0, 2).map(reward => (
                          <div key={reward.id} className="reward-card" onClick={() => { setSelectedReward(reward); document.querySelector('.checkout-container')?.scrollIntoView({ behavior: 'smooth' }); }}>
                            <div className="reward-amount">{formatCurrency(reward.min_amount)}</div>
                            <div className="reward-title">{reward.title}</div>
                            <p className="reward-description">
                              {reward.description?.length > 80 ? reward.description.slice(0, 80) + '...' : reward.description}
                            </p>
                            <span className="text-accent" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Select Reward &rarr;</span>
                          </div>
                        ))}
                      </div>
                      {rewards.length > 2 && (
                         <div className="text-center mt-3">
                           <button onClick={() => setTab('rewards')} className="btn btn-ghost">View all {rewards.length} rewards</button>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* REWARDS TAB */}
              {tab === 'rewards' && (
                <div className="reward-section animate-in" style={{ animationDelay: '0.1s' }}>
                  {rewards.length > 0 ? rewards.map(reward => (
                    <div key={reward.id} className="card reward-card flex" style={{ gap: '24px' }} onClick={() => { setSelectedReward(reward); document.querySelector('.checkout-container')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      {reward.image_url && (
                        <div style={{ width: '160px', height: '160px', flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                          <img src={reward.image_url} alt={reward.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="reward-amount">{formatCurrency(reward.min_amount)} <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 500 }}>or more</span></div>
                        <div className="reward-title">{reward.title}</div>
                        <p className="reward-description flex-1">{reward.description}</p>
                        <div className="flex-between mt-2">
                          {reward.max_claims && (
                            <span className="badge badge-category">
                              {reward.claimed_count} / {reward.max_claims} claimed
                              {reward.claimed_count >= reward.max_claims && ' (SOLD OUT)'}
                            </span>
                          )}
                          <span className="btn btn-sm btn-primary ml-auto">Select Reward</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="card card-body text-center py-6">
                      <FiGift size={48} className="text-muted mx-auto mb-3" />
                      <p className="text-secondary">No reward tiers available for this campaign.</p>
                    </div>
                  )}
                </div>
              )}

              {/* COMMENTS TAB */}
              {tab === 'comments' && (
                <div className="comment-list animate-in" style={{ animationDelay: '0.1s' }}>
                  
                  {user ? (
                    <form className="comment-form card card-body" onSubmit={handlePostComment}>
                      <div className="comment-avatar flex-center" style={{ background: 'var(--gradient-cool)', color: '#fff', fontWeight: 600 }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <textarea
                          className="form-textarea"
                          placeholder="Leave a comment or question to support the organizer..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          style={{ minHeight: '100px', marginBottom: '16px' }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={submittingComment || !newComment.trim()}>
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="alert alert-info">
                      Please <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 600 }}>log in</Link> to leave a comment.
                    </div>
                  )}

                  <div className="comments-list-wrapper mt-2">
                    {comments.length > 0 ? comments.map(c => (
                      <div key={c.id} className="comment-item mb-4">
                        <div className="comment-avatar flex-center" style={{ background: 'var(--slate-200)', color: 'var(--slate-700)', fontWeight: 600 }}>
                          {c.author_avatar ? <img src={c.author_avatar} alt={c.author_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : c.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="comment-body">
                          <div className="comment-header">
                            <div>
                              <span className="comment-author">{c.author_name}</span>
                              {c.author_role === 'admin' && <span className="badge badge-purple ml-2" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Admin</span>}
                              {c.user_id === campaign.creator_id && <span className="badge badge-accent ml-2" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Creator</span>}
                            </div>
                            <span className="comment-time">{timeAgo(c.created_at)}</span>
                          </div>
                          <div className="mt-2" style={{ color: 'var(--slate-800)', lineHeight: 1.6 }}>{c.content}</div>
                          
                          {(user && (user.role === 'admin' || user.id === c.user_id)) && (
                            <div className="mt-3">
                              <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDeleteComment(c.id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <FiMessageCircle size={48} className="text-muted mx-auto mb-3" />
                        <p className="text-secondary">No comments yet. Be the first to start the conversation!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* UPDATES TAB */}
              {tab === 'updates' && (
                <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                  {updates.length > 0 ? updates.map(u => (
                    <div key={u.id} className="card mb-4">
                      <div className="card-body">
                        {u.title && <h3 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>{u.title}</h3>}
                        <div className="text-muted mb-3 flex gap-1 items-center" style={{ fontSize: '0.9rem' }}>
                          <FiClock /> {new Date(u.created_at).toLocaleDateString()}
                        </div>
                        <p style={{ color: 'var(--slate-700)', lineHeight: 1.7 }}>{u.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="card card-body text-center py-6">
                      <FiActivity size={48} className="text-muted mx-auto mb-3" />
                      <p className="text-secondary">No updates posted yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* DONORS TAB */}
              {tab === 'donors' && (
                <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                  <div className="card card-gradient mb-4">
                    <div className="card-body text-center py-6">
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--slate-900)' }}>
                        {campaign.donor_count || donors.length} Supporters
                      </h3>
                      <p className="text-slate-600">Thank you to everyone who has served generosity.</p>
                    </div>
                  </div>

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

          {/* Right Column (Sticky Donation Sidebar) */}
          <div className="checkout-container hide-on-mobile" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
            <div style={{ position: 'sticky', top: '100px' }}>
              
              <div className="card checkout-panel" style={{ boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <div className="card-body" style={{ padding: '32px' }}>
                  <div className="progress-track mb-3" style={{ height: '8px', background: 'var(--slate-100)' }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--teal-500)', borderRadius: '4px' }}></div>
                  </div>
                  
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--slate-900)', lineHeight: 1 }}>
                    {formatCurrency(campaign.current_amount)}
                  </div>
                  <div className="text-muted mt-2 mb-4" style={{ fontSize: '1rem', fontWeight: 500 }}>
                    <span style={{ color: 'var(--slate-700)' }}>raised of {formatCurrency(campaign.goal_amount)} goal</span>
                  </div>
                  
                  <div className="text-muted mb-6" style={{ fontSize: '0.95rem' }}>
                    {campaign.donor_count || donors.length} donations
                  </div>
                  
                  <div className="flex flex-col gap-3 mb-6">
                    <button 
                      onClick={() => document.getElementById('guest-checkout-form')?.scrollIntoView({ behavior: 'smooth' })}
                      className="btn btn-primary btn-block btn-lg"
                      style={{ fontSize: '1.15rem', padding: '16px', background: 'linear-gradient(to right, var(--teal-500), var(--teal-600))', border: 'none', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)', borderRadius: 'var(--radius-lg)' }}
                    >
                      Donate now
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Campaign link copied to clipboard!');
                        }}
                        className="btn btn-secondary flex-1"
                        style={{ fontSize: '1.05rem', padding: '14px', background: 'var(--slate-100)', color: 'var(--slate-900)', border: 'none', borderRadius: 'var(--radius-lg)' }}
                      >
                        <FiShare2 /> Share
                      </button>
                      <button 
                        onClick={() => {
                          if (user) { alert('Saved to favorites!'); } 
                          else { alert('Please log in to save campaigns.'); }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '14px 20px', background: 'var(--slate-100)', color: 'var(--slate-900)', border: 'none', borderRadius: 'var(--radius-lg)' }}
                        aria-label="Save Campaign"
                      >
                        <FiHeart />
                      </button>
                    </div>
                  </div>
                  
                  {donors.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 0 8px', borderTop: '1px solid var(--border-light)' }}>
                      <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 700, fontSize: '1.1rem' }}>
                         {donors[0].donor_name ? donors[0].donor_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '1.05rem' }}>{donors[0].donor_name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                          Recent donation • <span style={{ fontWeight: 600, color: 'var(--teal-600)' }}>{formatCurrency(donors[0].amount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ background: 'var(--slate-50)', padding: '32px', borderTop: '1px solid var(--border-light)' }}>
                  <GuestCheckoutForm 
                    campaignId={campaign.id} 
                    campaignTitle={campaign.title} 
                    selectedReward={selectedReward}
                    rewards={rewards}
                  />
                  
                  {selectedReward && (
                    <div className="text-center mt-3">
                       <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReward(null)}>Clear Reward Selection</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky CTA Bar */}
        <div className={`mobile-sticky-bar ${showStickyBar ? 'visible' : ''}`} style={{ display: 'none' /* Handled correctly in CSS via media queries, we leave markup here */ }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--slate-900)' }}>
              {formatCurrency(campaign.current_amount)}
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              of {formatCurrency(campaign.goal_amount)}
            </div>
          </div>
          <button 
            onClick={() => document.querySelector('.checkout-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="btn btn-primary" style={{ padding: '12px 32px' }}
          >
            Donate Now
          </button>
        </div>

      </div>
    </div>
  );
}
