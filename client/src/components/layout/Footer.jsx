import { Link } from 'react-router-dom';
import { FiHeart, FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🍽️ DonatePlate</h3>
            <p>Serve Generosity. A vibrant crowdfunding platform where every donation is tracked and every campaign is verified.</p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" aria-label="Instagram"><FiInstagram /></a>
              <a href="#" aria-label="GitHub"><FiGithub /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/explore">Explore Campaigns</Link>
            <Link to="/campaigns/create">Start a Campaign</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/about">How It Works</Link>
            <Link to="/about">Success Stories</Link>
            <Link to="/contact">Support</Link>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Made with <FiHeart size={12} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--coral-500)' }} /> by DonatePlate &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
