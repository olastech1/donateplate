import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiInstagram, FiLinkedin, FiGithub, FiHeart, FiShield, FiLock } from 'react-icons/fi';

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  return (
    <footer className="footer">
      {/* Top gradient bar */}
      <div className="footer-gradient-bar" />
      
      <div className="container">
        {/* Main grid: 4 columns */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span style={{ fontSize: '1.2em', marginRight: '6px' }}>🍩</span>
              <span className="gradient-text">DonateFate</span>
            </Link>
            <p>Serve generosity. A vibrant crowdfunding platform where every campaign is verified and every donation is tracked transparently.</p>
            
            <div className="footer-social">
              <a href="#" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" aria-label="Instagram"><FiInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
            </div>
            
            <div className="footer-trust">
              <div className="trust-badge"><FiShield size={14} /> Stripe Secured</div>
              <div className="trust-badge"><FiLock size={14} /> SSL Encrypted</div>
            </div>
          </div>
          
          {/* Platform Links */}
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/explore">Explore Campaigns</Link>
            <Link to="/campaigns/create">Start a Campaign</Link>
            <Link to="/dashboard">Creator Dashboard</Link>
            <Link to="/about">About DonateFate</Link>
          </div>
          
          {/* Resources */}
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/about#how-it-works">How It Works</Link>
            <Link to="/about#faq">FAQ</Link>
            <Link to="/contact">Support Center</Link>
            <Link to="/track/demo">Track a Donation</Link>
          </div>
          
          {/* Newsletter */}
          <div className="footer-col footer-newsletter-col">
            <h4>Stay Updated</h4>
            <p className="footer-newsletter-desc">Get notified about trending campaigns and platform news.</p>
            {submitted ? (
              <div className="footer-newsletter-success">✓ Thanks for subscribing!</div>
            ) : (
              <form className="footer-newsletter-form" onSubmit={(e) => { e.preventDefault(); if(email) setSubmitted(true); }}>
                <input 
                  type="email" 
                  placeholder="Your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">Subscribe</button>
              </form>
            )}
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p>Made with <FiHeart size={12} style={{ display: 'inline', verticalAlign: 'middle', color: '#6366F1' }} /> by DonateFate &copy; {year}</p>
          </div>
          <div className="footer-bottom-right">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/refund-policy">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
