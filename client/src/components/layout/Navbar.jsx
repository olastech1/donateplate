import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiLayout, FiPlusCircle } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          🍽️ DonatePlate
        </Link>

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/explore" className={isActive('/explore')}>Explore</Link></li>
          <li><Link to="/about" className={isActive('/about')}>About</Link></li>
          <li><Link to="/contact" className={isActive('/contact')}>Contact</Link></li>

          {user ? (
            <>
              <li>
                <Link to="/campaigns/create" className="btn btn-sm btn-outline" style={{ gap: '6px' }}>
                  <FiPlusCircle size={15} /> Create
                </Link>
              </li>
              <li style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px 12px', borderRadius: 'var(--radius-full)',
                    transition: 'all var(--transition)',
                    color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--gradient-warm)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem'
                  }}>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px', overflow: 'hidden', zIndex: 200,
                    animation: 'fadeInDown 0.2s ease'
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <Link to={`/profile/${user.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem'
                    }}>
                      <FiUser size={16} /> My Profile
                    </Link>
                    <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem'
                    }}>
                      <FiLayout size={16} /> Dashboard
                    </Link>
                    <button onClick={logout} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', color: 'var(--danger)', fontSize: '0.9rem',
                      background: 'none', border: 'none', width: '100%', cursor: 'pointer',
                      borderTop: '1px solid var(--border-light)', fontFamily: 'var(--font-body)'
                    }}>
                      <FiLogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className={isActive('/login')}>Log in</Link></li>
              <li><Link to="/register" className="btn btn-sm btn-primary">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
