import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar({ onOpenCmdk }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const navItems = [
    { label: 'Home', href: user ? '/dashboard' : '/', match: (p) => p === '/' || p === '/dashboard' },
    { label: 'Explore', href: '/explore', match: (p) => p.startsWith('/explore') || p.startsWith('/projects') },
    { label: 'Communities', href: '/communities', match: (p) => p.startsWith('/communities') || p.startsWith('/discussions') },
    { label: 'Hackathons', href: '/hackathons', match: (p) => p.startsWith('/hackathons') },
    { label: 'Squads', href: '/squads', match: (p) => p.startsWith('/squads') },
    { label: 'Leaderboard', href: '/leaderboard', match: (p) => p.startsWith('/leaderboard') },
    { label: 'Portfolio Builder', href: '/portfolio', match: (p) => p.startsWith('/portfolio') },
    { label: 'Codex', href: '/codex', match: (p) => p.startsWith('/codex') },
  ];

  const userInitial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <>
      <div className="dock-wrap">
        <nav className="dock">
          {/* Brand */}
          <Link to="/" className="dock-brand" aria-label="DevVerse Home">
            <span className="mark">DV</span>
            <span>DevVerse</span>
          </Link>

          {/* Links */}
          <div className="dock-links">
            {navItems.map((item) => {
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`dock-link ${active ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="dock-actions">
            {/* Search / Command palette trigger */}
            <button
              type="button"
              className="cmdk-dock-trigger"
              onClick={onOpenCmdk}
              title="Search everything (Ctrl+K)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <span className="cmdk-trigger-label-text">Search</span>
              <kbd id="cmdk-trigger-kbd">Ctrl K</kbd>
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              className="dock-icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* User profile / Avatar or Sign In */}
            {user ? (
              <div className="dock-avatar-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  className="dock-icon-btn dock-avatar-btn"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  title={`${user.displayName || user.username}'s profile`}
                  aria-expanded={dropdownOpen}
                >
                  <div
                    className="dock-avatar-initial"
                    style={{
                      background: 'linear-gradient(135deg, #7c6fff, #ff8c42)',
                      color: '#07080c',
                      fontWeight: 800,
                    }}
                  >
                    {userInitial}
                  </div>
                </button>

                <div className={`dock-avatar-menu ${dropdownOpen ? 'open' : ''}`}>
                  <div className="dock-avatar-menu-header">
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {user.displayName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      @{user.username}
                    </div>
                  </div>
                  <Link to="/dashboard" className="dock-avatar-menu-item">
                    Dashboard
                  </Link>
                  <Link to={`/profile/${user.username}`} className="dock-avatar-menu-item">
                    My Profile
                  </Link>
                  <Link to="/portfolio" className="dock-avatar-menu-item">
                    Portfolio Studio
                  </Link>
                  <Link to="/bookmarks" className="dock-avatar-menu-item">
                    Bookmarks
                  </Link>
                  <Link to="/settings" className="dock-avatar-menu-item">
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="dock-avatar-menu-item dock-avatar-menu-item-danger"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn btn-sm btn-primary">
                Sign In
              </Link>
            )}

            {/* Settings button */}
            <Link to="/settings" className="dock-icon-btn" title="Settings">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
              </svg>
            </Link>

            {/* Mobile hamburger toggle */}
            <button
              type="button"
              className="dock-icon-btn dock-mobile-toggle"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle mobile menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={item.match(location.pathname) ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        {user ? (
          <>
            <Link to={`/profile/${user.username}`} onClick={() => setMobileMenuOpen(false)}>
              My Profile
            </Link>
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
              Settings
            </Link>
            <button
              type="button"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '26px',
                fontWeight: 600,
                padding: '12px 4px',
                color: 'var(--coral)',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
            Sign In
          </Link>
        )}
      </div>
    </>
  );
}
