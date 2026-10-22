import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
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

  // Close menus on route change
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

  const navLinks = [
    { label: 'Explore', href: '/explore' },
    { label: 'Communities', href: '/communities' },
    { label: 'Codex', href: '/codex' },
    { label: 'Hackathons', href: '/hackathons' }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const userInitial = (user?.name || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" aria-label="DevVerse Home">
          <div className="navbar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="grad-text">DevVerse</span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="navbar-links">
          {navLinks.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`navbar-link ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              /* Sun icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Moon icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {user ? (
            /* Authenticated: User Dropdown */
            <div className="navbar-user-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`navbar-user-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username || 'User avatar'}
                    className="avatar avatar-sm"
                  />
                ) : (
                  <div className="avatar avatar-sm avatar-placeholder">
                    {userInitial}
                  </div>
                )}
                <span className="navbar-username">{user.name || user.username}</span>
                <svg
                  className={`navbar-chevron ${dropdownOpen ? 'open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown" role="menu">
                  <div className="navbar-dropdown-header">
                    <p className="navbar-dropdown-user-name">{user.name || user.username}</p>
                    <p className="navbar-dropdown-user-handle">@{user.username}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    className="navbar-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9" />
                      <rect x="14" y="3" width="7" height="5" />
                      <rect x="14" y="12" width="7" height="9" />
                      <rect x="3" y="16" width="7" height="5" />
                    </svg>
                    Dashboard
                  </Link>

                  <Link
                    to={`/profile/${user.username}`}
                    className="navbar-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="navbar-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </Link>

                  <div className="navbar-dropdown-divider" />

                  <button
                    type="button"
                    className="navbar-dropdown-item danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated: Sign In & Get Started */
            <>
              <Link to="/login" className="btn btn-ghost btn-sm btn-login">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm btn-register">
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer & Overlay */}
      {mobileMenuOpen && (
        <div
          className="navbar-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className="navbar-mobile-header">
          <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="grad-text">DevVerse</span>
          </Link>
          <button
            type="button"
            className="navbar-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {user && (
          <div className="navbar-mobile-user">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="avatar avatar-sm" />
            ) : (
              <div className="avatar avatar-sm avatar-placeholder">{userInitial}</div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
                {user.name || user.username}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                @{user.username}
              </div>
            </div>
          </div>
        )}

        <nav className="navbar-mobile-nav">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`navbar-mobile-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{item.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}

          {user && (
            <>
              <div className="navbar-dropdown-divider" style={{ margin: 'var(--space-2) 0' }} />
              <Link
                to="/dashboard"
                className={`navbar-mobile-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Dashboard</span>
              </Link>
              <Link
                to={`/profile/${user.username}`}
                className={`navbar-mobile-link ${isActive(`/profile/${user.username}`) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Profile</span>
              </Link>
              <Link
                to="/settings"
                className={`navbar-mobile-link ${isActive('/settings') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Settings</span>
              </Link>
            </>
          )}
        </nav>

        <div className="navbar-mobile-footer">
          {user ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
