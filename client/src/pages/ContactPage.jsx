import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export default function ContactPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic()
      .then(res => {
        if (res.data && res.data.data && res.data.data.page_contact) {
          setContent(res.data.data.page_contact);
        }
      })
      .catch(err => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const defaultContent = `
    <p style="margin-bottom: 24px;">Have a question, concern, or need help with a campaign? Our support team is here for you.</p>
    <div class="card" style="margin-bottom: 32px; padding: 32px;">
      <h3 style="margin-bottom: 16px; color: var(--slate-800);">Get in Touch</h3>
      <p style="margin-bottom: 12px;"><strong>Email Support:</strong> support@donateplea.com</p>
      <p style="margin-bottom: 12px;"><strong>Press & Media:</strong> press@donateplea.com</p>
      <p><strong>Response Time:</strong> We aim to respond to all inquiries within 24-48 hours.</p>
    </div>
  `;

  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>Contact Us</h1>
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
