import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand & Tagline */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="grad-text">DevVerse</span>
            </Link>
            <p className="footer-tagline">
              The modern ecosystem for developers to showcase projects, build squads, collaborate in communities, and compete in hackathons.
            </p>
          </div>

          {/* Column 1: Platform */}
          <div className="footer-column">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/explore" className="footer-link">Explore</Link></li>
              <li><Link to="/communities" className="footer-link">Communities</Link></li>
              <li><Link to="/hackathons" className="footer-link">Hackathons</Link></li>
              <li><Link to="/leaderboard" className="footer-link">Leaderboard</Link></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="footer-column">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/codex" className="footer-link">Codex</Link></li>
              <li><Link to="/squads" className="footer-link">Squads</Link></li>
              <li><Link to="/portfolio" className="footer-link">Portfolio</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><a href="#about" className="footer-link">About</a></li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  GitHub
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} DevVerse. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <span className="footer-legal-link">Built for developers worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
