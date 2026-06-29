import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiMenu, FiX, FiUser, FiLogOut, FiLayout, FiPlusCircle,
  FiChevronDown, FiCompass, FiShield, FiInfo
} from 'react-icons/fi';

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
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--accent-glow)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>D</span>
          </div>
          <span style={{ color: 'var(--text-primary)' }}>Donate</span>
          <span className="gradient-text" style={{ marginLeft: '-6px' }}>Plate</span>
        </Link>

        {/* Hamburger — mobile only */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Nav links */}
        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>

          {/* Mobile user header */}
          {menuOpen && user && (
            <li style={{ listStyle: 'none', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 0 16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-sunset)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '8px' }} />
            </li>
          )}

          {/* Core nav links */}
          <li><Link to="/explore" className={isActive('/explore')}><FiCompass size={15} style={{ marginRight: 6 }} />Explore</Link></li>
          <li><Link to="/about#how-it-works"><FiInfo size={15} style={{ marginRight: 6 }} />How It Works</Link></li>
          <li><Link to="/about" className={isActive('/about')}>About</Link></li>
          <li><Link to="/contact" className={isActive('/contact')}>Contact</Link></li>

          {/* Mobile: logged-in user actions */}
          {user && menuOpen && (
            <>
              <li style={{ height: '1px', background: 'var(--border)', margin: '8px 0', listStyle: 'none' }} />
              <li><Link to="/campaigns/create" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700, padding: '12px', fontSize: '1.05rem', textDecoration: 'none', borderRadius: 'var(--radius)' }}><FiPlusCircle size={18} /> Start a Campaign</Link></li>
              <li><Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1.05rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 'var(--radius)' }}><FiLayout size={18} /> My Dashboard</Link></li>
              <li><Link to={`/dashboard?tab=profile`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1.05rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 'var(--radius)' }}><FiUser size={18} /> My Profile</Link></li>
              {user.role === 'admin' && (
                <li><Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1.05rem', textDecoration: 'none', color: 'var(--warning)', fontWeight: 600, borderRadius: 'var(--radius)' }}><FiShield size={18} /> Admin Panel</Link></li>
              )}
              <li style={{ height: '1px', background: 'var(--border)', margin: '8px 0', listStyle: 'none' }} />
              <li>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1.05rem', color: 'var(--danger)', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <FiLogOut size={18} /> Sign Out
                </button>
              </li>
            </>
          )}

          {/* Mobile: guest buttons */}
          {!user && menuOpen && (
            <>
              <li style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <Link to="/login" className="btn btn-outline btn-block" style={{ textAlign: 'center', display: 'block' }}>Log in</Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-primary btn-block" style={{ textAlign: 'center', display: 'block' }}>Get Started Free</Link>
              </li>
            </>
          )}

          {/* Desktop: logged-in controls */}
          {user ? (
            <>
              <li className="hide-on-mobile">
                <Link to="/campaigns/create" className="btn btn-sm btn-outline" style={{ gap: '6px', marginLeft: '12px' }}>
                  <FiPlusCircle size={15} /> Create
                </Link>
              </li>
              <li className="hide-on-mobile" style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  className="navbar-user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-body)', marginLeft: '4px' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-sunset)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <FiChevronDown size={16} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {dropdownOpen && (
                  <div className="navbar-dropdown animate-fade" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)', minWidth: '230px', overflow: 'hidden', zIndex: 200 }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                      <Link to={`/dashboard?tab=profile`} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}><FiUser size={16} /> My Profile</Link>
                      <Link to="/dashboard" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}><FiLayout size={16} /> My Dashboard</Link>
                      <Link to="/campaigns/create" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}><FiPlusCircle size={16} /> Start a Campaign</Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}><FiShield size={16} /> Admin Panel</Link>
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px 0' }}>
                      <button onClick={handleLogout} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', color: 'var(--danger)', fontSize: '0.9rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                        <FiLogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li className="hide-on-mobile"><Link to="/login" className={isActive('/login')} style={{ fontWeight: 600 }}>Log in</Link></li>
              <li className="hide-on-mobile"><Link to="/register" className="btn btn-sm btn-primary">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
