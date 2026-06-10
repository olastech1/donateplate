import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../utils/currency';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">💜 Donate Plea</Link>
        <button className="navbar-hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
        <ul className={`navbar-links ${open ? 'open' : ''}`}>
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <select 
              value={currency || 'USD'}
              onChange={(e) => changeCurrency(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', color: 'var(--text-color)', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </li>
          <li><Link to="/explore" onClick={() => setOpen(false)}>Explore</Link></li>
          {user ? (
            <>
              {user.role === 'admin' ? (
                <li><Link to="/admin" onClick={() => setOpen(false)} style={{ color: 'var(--accent)', fontWeight: 600 }}>Admin</Link></li>
              ) : (
                <li><Link to="/dashboard" onClick={() => setOpen(false)} style={{ color: 'var(--accent)', fontWeight: 600 }}>Dashboard</Link></li>
              )}
              <li><Link to="/campaigns/create" onClick={() => setOpen(false)} className="btn btn-primary btn-sm">Start Campaign</Link></li>
              <li><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={() => setOpen(false)}>Login</Link></li>
              <li><Link to="/register" onClick={() => setOpen(false)} className="btn btn-primary btn-sm">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
