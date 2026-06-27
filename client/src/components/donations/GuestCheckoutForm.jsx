import { useState, useEffect } from 'react';
import { donationAPI, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const PRESETS = [10, 25, 50, 100, 250, 500];

export default function GuestCheckoutForm({ campaignId, campaignTitle, selectedReward, rewards }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationType, setDonationType] = useState('one-time');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    settingsAPI.getPublic().then(res => {
      if (res.data.data.stripe_public_key) {
        setStripePromise(loadStripe(res.data.data.stripe_public_key));
      }
    }).catch(console.error);
  }, []);

  // Pre-fill amount if a reward is selected
  useEffect(() => {
    if (selectedReward) {
      setAmount(selectedReward.min_amount.toString());
    }
  }, [selectedReward]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }

    if (selectedReward && parsedAmount < selectedReward.min_amount) {
      setError(`Minimum amount for this reward is $${selectedReward.min_amount}`);
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
        amount: parsedAmount,
        is_anonymous: isAnonymous,
        donation_type: donationType,
        comment: comment,
        reward_tier_id: selectedReward ? selectedReward.id : null
      };
      if (!user) {
        payload.guest_name = guestName || 'Guest Donor';
        payload.guest_email = guestEmail;
      }

      const res = await donationAPI.initiate(payload);

      if (res.data.data.client_secret) {
        setClientSecret(res.data.data.client_secret);
      } else if (res.data.data.checkout_url) {
        window.location.href = res.data.data.checkout_url;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (clientSecret && stripePromise) {
    return (
      <div className="donate-box" id="guest-checkout-form">
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <div className="donate-box card-glass" id="guest-checkout-form">
      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', fontSize: '1.3rem', fontWeight: 700 }}>
        Support This Campaign
      </h3>

      {error && <div className="alert alert-error">{error}</div>}
      
      {selectedReward && (
        <div className="alert alert-info mb-3">
          <strong>Selected Reward:</strong> {selectedReward.title} (Min ${selectedReward.min_amount})
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* Donation Type Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`btn ${donationType === 'one-time' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '10px', fontWeight: 600, borderRadius: 'var(--radius-sm)' }}
            onClick={() => setDonationType('one-time')}
          >
            One-time
          </button>
          <button
            type="button"
            className={`btn ${donationType === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '10px', fontWeight: 600, borderRadius: 'var(--radius-sm)' }}
            onClick={() => setDonationType('monthly')}
          >
            Monthly
          </button>
        </div>

        {/* Amount presets */}
        {!selectedReward && (
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
        )}

        {/* Custom amount */}
        <div className="form-group">
          <label className="form-label">{selectedReward ? 'Your Donation Amount (USD)' : 'Or enter a custom amount (USD)'}</label>
          <input 
            type="number"
            className="form-input"
            placeholder="$ Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={selectedReward ? selectedReward.min_amount : "1"}
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
              />
            </div>
          </>
        )}

        {/* Comment field */}
        <div className="form-group">
          <label className="form-label">Add a public comment (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Words of support..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="2"
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* Anonymous toggle */}
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="anonymous-toggle"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="anonymous-toggle" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            Donate anonymously (hide my name)
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: '10px' }}>
          {loading ? 'Redirecting...' : `Support${amount ? ` $${Number(amount).toLocaleString()}` : ''} ${donationType === 'monthly' ? '/ month' : ''}`}
        </button>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
          🔒 Secured by Stripe. {user ? `Logged in as ${user.name}` : 'No account required.'}
        </p>
      </form>
    </div>
  );
}
