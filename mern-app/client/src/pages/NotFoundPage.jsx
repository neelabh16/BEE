import { Link, useLocation } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="notfound-container animate-fade-in">
      <div className="notfound-content">
        <span className="notfound-badge">ERROR 404 // RESOURCE_NOT_FOUND</span>

        <h1 className="notfound-title">404</h1>

        {/* Terminal Graphic */}
        <div className="notfound-terminal">
          <div className="notfound-terminal-header">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="terminal-title">bash — devverse-router</span>
          </div>

          <div className="notfound-terminal-body">
            <div className="term-line-err">
              ✖ Exception: RouteNotFoundError: Failed to resolve path &quot;{location.pathname}&quot;
            </div>
            <div className="term-line-dim">
              at DevVerseRouter.lookup (client/src/App.jsx:81:7)
            </div>
            <div className="term-line-dim">
              at VirtualDOM.reconcile (fiber.js:404:12)
            </div>
            <div className="term-line-accent">
              ⚡ Status: 404 Null Pointer to Digital Realm.
            </div>
          </div>
        </div>

        <p className="notfound-desc">
          The requested coordinate does not exist in the DevVerse universe or may have been refactored into a parallel branch.
        </p>

        <div className="notfound-actions">
          <Link to="/dashboard" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Return to Dashboard
          </Link>

          <Link to="/explore" className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Explore Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
