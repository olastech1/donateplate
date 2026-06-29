import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CampaignCard from '../components/campaign/CampaignCard';
import { campaignAPI } from '../services/api';
import { FiSearch, FiFilter, FiInbox } from 'react-icons/fi';

const CATEGORIES = ['all', 'medical', 'education', 'community', 'crisis_relief', 'personal', 'general'];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const fetchCampaigns = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (category !== 'all') params.category = category;
    if (search) params.search = search;

    campaignAPI.list(params)
      .then(res => {
        setCampaigns(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns();
  };

  return (
    <div className="page" id="explore-page">
      <div className="container">
        
        {/* Header section with gradient mesh background effect behind it */}
        <div className="section-header animate-fade" style={{ paddingTop: '20px' }}>
          <div className="badge badge-primary mb-3">Discover</div>
          <h2>Explore Campaigns</h2>
          <p>Find a cause that matters to you and make a difference today.</p>
        </div>

        {/* Custom Filter Bar */}
        <div className="filter-bar animate-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '300px', display: 'flex', gap: '8px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', fontSize: '1.2rem' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by title, creator, or keywords..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ paddingLeft: '48px', borderRadius: 'var(--radius-full)', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'none' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>Search</button>
          </form>
          
          <div className="show-on-mobile" style={{ width: '100%' }}>
            <div className="flex" style={{ gap: '12px', alignItems: 'center', width: '100%' }}>
              <FiFilter color="var(--text-muted)" />
              <select 
                className="form-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills (Desktop) */}
        <div className="category-pills hide-on-mobile animate-in" style={{ animationDelay: '0.2s', marginBottom: '40px', justifyContent: 'center' }}>
          {CATEGORIES.map(c => (
            <button 
              key={c} 
              onClick={() => setCategory(c)} 
              className={`category-pill ${category === c ? 'active' : ''}`}
            >
              {c === 'all' ? 'All Causes' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-3 pt-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}></div>
                <div className="card-body">
                  <div className="skeleton mb-2" style={{ height: '24px', width: '70%' }}></div>
                  <div className="skeleton mb-3" style={{ height: '40px' }}></div>
                  <div className="skeleton mb-2" style={{ height: '8px' }}></div>
                  <div className="skeleton" style={{ height: '12px', width: '40%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length > 0 ? (
          <div className="animate-in" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-3">
              {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '60px' }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button key={i} onClick={() => fetchCampaigns(i + 1)}
                    className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-full)' }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card card-body text-center animate-scale" style={{ padding: '80px 24px', maxWidth: '600px', margin: '40px auto' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--slate-50)', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 24px' }}>
              <FiInbox />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>No campaigns found</h3>
            <p className="text-secondary mb-4">We couldn't find any campaigns matching "{search}" in {category === 'all' ? 'all categories' : category}.</p>
            <button onClick={() => { setSearch(''); setCategory('all'); }} className="btn btn-secondary">Clear All Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
