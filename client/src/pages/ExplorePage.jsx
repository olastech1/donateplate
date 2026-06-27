import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CampaignCard from '../components/campaign/CampaignCard';
import { campaignAPI } from '../services/api';
import { FiSearch, FiFilter } from 'react-icons/fi';

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
        setCampaigns(res.data.data);
        setPagination(res.data.pagination);
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
    <div className="page" style={{ background: 'var(--bg-secondary)' }} id="explore-page">
      <div className="container">
        <div className="section-header animate-fade">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--slate-800)' }}>Explore Campaigns</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Find a cause that matters to you and make a difference today.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="card-glass animate-fade" style={{ animationDelay: '0.1s', padding: '16px', marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '280px', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search by title or creator..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ paddingLeft: '44px', background: 'var(--slate-50)', border: '1px solid var(--border)', borderRadius: '30px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '30px', padding: '0 24px' }}>Search</button>
          </form>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiFilter color="var(--text-muted)" />
            <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filter:</span>
            <select 
              className="form-input" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: 'auto', background: 'var(--slate-50)', border: '1px solid var(--border)', borderRadius: '30px', cursor: 'pointer' }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category filter pills (Desktop) */}
        <div className="hide-on-mobile animate-fade" style={{ animationDelay: '0.2s', display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: '20px' }}>
              {c === 'all' ? 'All Causes' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Campaigns Grid */}
        {loading ? (
           <div className="flex-center py-4"><div className="spinner" /></div>
        ) : campaigns.length > 0 ? (
          <div className="animate-fade" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-3">
              {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '48px' }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button key={i} onClick={() => fetchCampaigns(i + 1)}
                    className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card-glass text-center animate-fade" style={{ padding: '80px 20px', margin: '40px auto', maxWidth: '600px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>No campaigns found</h3>
            <p className="text-muted">We couldn't find any campaigns matching your search criteria.</p>
            <button onClick={() => { setSearch(''); setCategory('all'); }} className="btn btn-secondary mt-3">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
