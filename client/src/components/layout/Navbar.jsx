import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiLayout, FiPlusCircle, FiBell, FiChevronDown, FiSettings, FiHome, FiCompass, FiShield, FiHeart } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span style={{ fontSize: '1.2em', marginRight: '6px' }}>🍩</span>
          <span className="gradient-text">DonateFate</span>
        </Link>

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/explore" className={isActive('/explore')}>Explore</Link></li>
          <li><Link to="/about#how-it-works">How It Works</Link></li>
          <li><Link to="/about" className={isActive('/about')}>About</Link></li>
          <li><Link to="/contact" className={isActive('/contact')}>Contact</Link></li>

          {user ? (
            <>
              <li className="hide-on-mobile">
                <Link to="/campaigns/create" className="btn btn-sm btn-outline" style={{ gap: '6px', marginLeft: '12px' }}>
                  <FiPlusCircle size={15} /> Create
                </Link>
              </li>
              <li className="hide-on-mobile" style={{ marginLeft: '8px' }}>
                <button aria-label="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)' }}>
                  <FiBell size={20} />
                </button>
              </li>
              <li style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  className="navbar-user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px 12px', borderRadius: 'var(--radius-full)',
                    transition: 'all var(--transition)',
                    color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)', marginLeft: '4px'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--gradient-sunset)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <FiChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                </button>

                {dropdownOpen && (
                  <div className="navbar-dropdown animate-fade" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)',
                    minWidth: '220px', overflow: 'hidden', zIndex: 200,
                  }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                      <Link to={`/profile/${user.id}`} className="dropdown-item" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem',
                        transition: 'background var(--transition-fast)'
                      }}>
                        <FiUser size={16} /> My Profile
                      </Link>
                      <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="dropdown-item" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem',
                        transition: 'background var(--transition-fast)'
                      }}>
                        <FiLayout size={16} /> Dashboard
                      </Link>
                      <Link to="/settings" className="dropdown-item" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem',
                        transition: 'background var(--transition-fast)'
                      }}>
                        <FiSettings size={16} /> Settings
                      </Link>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px 0' }}>
                      <button onClick={handleLogout} className="dropdown-item" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', color: 'var(--danger)', fontSize: '0.9rem',
                        background: 'none', border: 'none', width: '100%', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', transition: 'background var(--transition-fast)',
                        textAlign: 'left'
                      }}>
                        <FiLogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className={isActive('/login')} style={{ fontWeight: 600 }}>Log in</Link></li>
              <li><Link to="/register" className="btn btn-sm btn-primary">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
