import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-body">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="app-main-wrapper">
          <div className="app-mobile-nav-trigger">
            <button
              type="button"
              className="app-sidebar-toggle-btn"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              <span>Navigation Menu</span>
            </button>
          </div>
          <main className="app-main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
