export default function ContactPage() {
  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>Contact Us</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
        <p style={{ marginBottom: '24px' }}>
          Have a question, concern, or need help with a campaign? Our support team is here for you.
        </p>
        
        <div className="card" style={{ marginBottom: '32px' }}>
          <div className="card-body" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--slate-800)' }}>Get in Touch</h3>
            <p style={{ marginBottom: '12px' }}><strong>Email Support:</strong> support@donateplea.com</p>
            <p style={{ marginBottom: '12px' }}><strong>Press & Media:</strong> press@donateplea.com</p>
            <p><strong>Response Time:</strong> We aim to respond to all inquiries within 24-48 hours.</p>
          </div>
        </div>

        <h3 style={{ marginBottom: '16px', color: 'var(--slate-800)' }}>Trust & Safety</h3>
        <p>
          If you believe a campaign is fraudulent or violates our terms of service, please report it immediately to <strong>safety@donateplea.com</strong>.
        </p>
      </div>
    </div>
  );
}
