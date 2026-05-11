import { useState } from 'react';
import { donationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PRESETS = [10, 25, 50, 100, 250, 500];

export default function GuestCheckoutForm({ campaignId, campaignTitle }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }
    if (!user && !guestEmail) {
      setError('Please enter your email address to receive your receipt.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        campaign_id: campaignId,
        amount: parseFloat(amount),
        is_anonymous: isAnonymous
      };
      if (!user) {
        payload.guest_name = guestName || 'Guest Donor';
        payload.guest_email = guestEmail;
      }

      const res = await donationAPI.initiate(payload);

      // Redirect to Stripe Checkout
      if (res.data.data.checkout_url) {
        window.location.href = res.data.data.checkout_url;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-box" id="guest-checkout-form">
      <h3>Support this Campaign</h3>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Amount presets */}
        <div className="amount-presets">
          {PRESETS.map(val => (
            <button
              type="button"
              key={val}
              className={`amount-preset ${parseFloat(amount) === val ? 'active' : ''}`}
              onClick={() => setAmount(val.toString())}
            >
              ${val}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="form-group">
          <label className="form-label">Or enter a custom amount</label>
          <input
            type="number"
            className="form-input"
            placeholder="$ Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            id="donation-amount-input"
          />
        </div>

        {/* Guest fields */}
        {!user && (
          <>
            <div className="form-group">
              <label className="form-label">Your Name (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="How should we show your name?"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                id="guest-name-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="For your receipt & tracking link"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                id="guest-email-input"
              />
            </div>
          </>
        )}

        {/* Anonymous toggle */}
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="anonymous-toggle"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="anonymous-toggle" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Donate anonymously
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} id="donate-submit-btn">
          {loading ? 'Redirecting to Stripe...' : `Donate${amount ? ` $${Number(amount).toLocaleString()}` : ''}`}
        </button>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
          🔒 Secured by Stripe. No account required.
        </p>
      </form>
    </div>
  );
}
