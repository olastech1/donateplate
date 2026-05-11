import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CampaignCard from '../components/campaigns/CampaignCard';
import { campaignAPI } from '../services/api';

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
    <div className="page container" id="explore-page">
      <div className="section-header">
        <h1 style={{ fontFamily: 'var(--font-display)' }}>Explore Campaigns</h1>
        <p>Find a cause that matters to you</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
        <input type="text" className="form-input" placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}>
            {c === 'all' ? 'All' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? <div className="spinner" /> : campaigns.length > 0 ? (
        <>
          <div className="grid grid-3">
            {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '40px' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button key={i} onClick={() => fetchCampaigns(i + 1)}
                  className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>No campaigns found matching your criteria.</p>
      )}
    </div>
  );
}
