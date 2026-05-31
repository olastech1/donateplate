import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export default function PrivacyPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic()
      .then(res => {
        if (res.data && res.data.data && res.data.data.page_privacy_policy) {
          setContent(res.data.data.page_privacy_policy);
        }
      })
      .catch(err => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const defaultContent = `
    <div style="color: var(--text-secondary); line-height: 1.8;">
      <p style="margin-bottom: 16px;"><strong>Last Updated:</strong> May 2026</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">1. Information We Collect</h3>
      <p style="margin-bottom: 16px;">We collect information you provide directly to us, such as when you create an account, start a campaign, or make a donation. This may include your name, email address, and payment information (processed securely via Stripe).</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">2. How We Use Your Information</h3>
      <p style="margin-bottom: 16px;">We use the information we collect to operate, maintain, and provide the features of Donate Plea, including processing transactions, verifying identities for fraud prevention (KYC), and sending you updates.</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">3. Information Sharing</h3>
      <p style="margin-bottom: 16px;">We do not sell your personal information. We share information with third-party vendors (like Stripe for payments) only as necessary to provide our services. Guest donations can be made anonymously.</p>
      <h3 style="margin-top: 24px; margin-bottom: 12px; color: var(--slate-800);">4. Data Security</h3>
      <p style="margin-bottom: 16px;">We use industry-standard security measures to protect your data. Payment information is securely transmitted directly to our payment processor and is never stored on our servers.</p>
    </div>
  `;

  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>Privacy Policy</h1>
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
