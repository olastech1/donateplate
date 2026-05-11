export default function AboutPage() {
  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', color: 'var(--slate-800)' }}>About Donate Plea</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
        <p style={{ marginBottom: '16px' }}>
          Donate Plea is a transparent, secure, and user-centric crowdfunding platform designed to bridge the gap between people in need and those who want to help. 
        </p>
        <p style={{ marginBottom: '16px' }}>
          We believe that every plea deserves an answer. Our mission is to make giving as frictionless as possible while maintaining the highest standards of security and transparency. 
        </p>
        <h3 style={{ marginTop: '32px', marginBottom: '16px', color: 'var(--slate-800)' }}>Our Core Values</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Transparency:</strong> Every dollar is tracked. Donors can see exactly where their money goes.</li>
          <li style={{ marginBottom: '8px' }}><strong>Trust:</strong> We enforce strict KYC (Know Your Customer) policies to verify campaign creators.</li>
          <li style={{ marginBottom: '8px' }}><strong>Accessibility:</strong> No account is needed to donate. We believe giving should be easy.</li>
        </ul>
        <p>
          Whether it's medical emergencies, educational funds, or community relief, Donate Plea provides the infrastructure to empower generosity globally.
        </p>
      </div>
    </div>
  );
}
