import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export default function TermsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic()
      .then(res => {
        if (res.data && res.data.data && res.data.data.page_terms_conditions) {
          setContent(res.data.data.page_terms_conditions);
        }
      })
      .catch(err => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const defaultContent = `
    <div style="color: var(--text-secondary); line-height: 1.8;">
      <p style="margin-bottom: 16px;"><strong>Last Updated:</strong> May 2026</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">1. Acceptance of Terms</h3>
      <p style="margin-bottom: 16px;">By accessing or using DonatePlate, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the platform.</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">2. Use of the Platform</h3>
      <p style="margin-bottom: 16px;">DonatePlate is a platform to facilitate donations to verified campaigns. We are not a broker, financial institution, or charity. We do not guarantee the accuracy of campaign claims, though we enforce strict KYC policies for creators.</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">3. Campaign Creation & KYC</h3>
      <p style="margin-bottom: 16px;">Users creating campaigns ("Creators") must provide accurate KYC information. Funds will not be disbursed until identity and banking details are fully verified by our admin team. Misrepresentation will result in immediate account termination and potential legal action.</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">4. Donations and Refunds</h3>
      <p style="margin-bottom: 16px;">All donations are made voluntarily. Refunds are generally not provided once a campaign has received the funds, except in cases of proven fraud. A platform fee may be deducted from donations to cover payment processing and operational costs.</p>
    </div>
  `;

  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>Terms and Conditions</h1>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading content...</div>
      ) : (
        <div 
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: content || defaultContent }} 
        />
      )}
    </div>
  );
}
