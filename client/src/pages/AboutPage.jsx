import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export default function AboutPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic()
      .then(res => {
        if (res.data && res.data.data && res.data.data.page_about_us) {
          setContent(res.data.data.page_about_us);
        }
      })
      .catch(err => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const defaultContent = `
    <div style="color: var(--text-secondary); line-height: 1.8; font-size: 1.05rem;">
      <p style="margin-bottom: 16px;">Donate Plea is a transparent, secure, and user-centric crowdfunding platform designed to bridge the gap between people in need and those who want to help.</p>
      <p style="margin-bottom: 16px;">We believe that every plea deserves an answer. Our mission is to make giving as frictionless as possible while maintaining the highest standards of security and transparency.</p>
      <h3 style="margin-top: 32px; margin-bottom: 16px; color: var(--slate-800);">Our Core Values</h3>
      <ul style="padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;"><strong>Transparency:</strong> Every dollar is tracked. Donors can see exactly where their money goes.</li>
        <li style="margin-bottom: 8px;"><strong>Trust:</strong> We enforce strict KYC (Know Your Customer) policies to verify campaign creators.</li>
        <li style="margin-bottom: 8px;"><strong>Accessibility:</strong> No account is needed to donate. We believe giving should be easy.</li>
      </ul>
      <p>Whether it's medical emergencies, educational funds, or community relief, Donate Plea provides the infrastructure to empower generosity globally.</p>
    </div>
  `;

  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>About Donate Plea</h1>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading content...</div>
      ) : (
        <div 
          style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }} 
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: content || defaultContent }} 
        />
      )}
    </div>
  );
}
