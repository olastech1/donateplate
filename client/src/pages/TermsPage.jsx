export default function TermsPage() {
  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>Terms and Conditions</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <p style={{ marginBottom: '16px' }}><strong>Last Updated:</strong> May 2026</p>
        
        <h3 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--slate-800)' }}>1. Acceptance of Terms</h3>
        <p style={{ marginBottom: '16px' }}>
          By accessing or using Donate Plea, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the platform.
        </p>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--slate-800)' }}>2. Use of the Platform</h3>
        <p style={{ marginBottom: '16px' }}>
          Donate Plea is a platform to facilitate donations to verified campaigns. We are not a broker, financial institution, or charity. We do not guarantee the accuracy of campaign claims, though we enforce strict KYC policies for creators.
        </p>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--slate-800)' }}>3. Campaign Creation & KYC</h3>
        <p style={{ marginBottom: '16px' }}>
          Users creating campaigns ("Creators") must provide accurate KYC information. Funds will not be disbursed until identity and banking details are fully verified by our admin team. Misrepresentation will result in immediate account termination and potential legal action.
        </p>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--slate-800)' }}>4. Donations and Refunds</h3>
        <p style={{ marginBottom: '16px' }}>
          All donations are made voluntarily. Refunds are generally not provided once a campaign has received the funds, except in cases of proven fraud. A platform fee may be deducted from donations to cover payment processing and operational costs.
        </p>
      </div>
    </div>
  );
}
