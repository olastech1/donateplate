import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { settingsAPI } from '../services/api';

export default function DynamicPage() {
  const { slug } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    settingsAPI.getPublic()
      .then(res => {
        const pageKey = `page_${slug.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        if (res.data && res.data.data && res.data.data[pageKey]) {
          setContent(res.data.data[pageKey]);
        } else {
          setContent(null); // Not found
        }
      })
      .catch(err => {
        console.error('Failed to load page content', err);
        setContent(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="page container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="page container" style={{ minHeight: '60vh', textAlign: 'center', paddingTop: '80px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="container">
          <h1 className="gradient-text" style={{ textTransform: 'capitalize' }}>
            {slug.replace(/-/g, ' ')}
          </h1>
        </div>
      </div>
      
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
        <div 
          className="rich-text-content"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </div>
    </div>
  );
}
