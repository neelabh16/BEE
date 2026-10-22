import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Bookmarks.css';

export default function BookmarksPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'codex'
  const [projects, setProjects] = useState([]);
  const [codexEntries, setCodexEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/bookmarks');
      if (res.success && res.data) {
        setProjects(Array.isArray(res.data.projects) ? res.data.projects : []);
        setCodexEntries(Array.isArray(res.data.codex) ? res.data.codex : []);
      }
    } catch (err) {
      // Fallback try separate endpoints
      try {
        const [projRes, codexRes] = await Promise.all([
          api.get('/projects?limit=50'),
          api.get('/codex?limit=50'),
        ]);
        // If users/bookmarks wasn't available, we could check project bookmarks
        if (projRes.success) setProjects(projRes.data || []);
        if (codexRes.success) setCodexEntries(codexRes.data || []);
      } catch (fallbackErr) {
        toast.error('Failed to load bookmarks');
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Remove Project Bookmark
  const handleRemoveProjectBookmark = async (projectId) => {
    setActionLoadingId(projectId);
    try {
      const res = await api.post(`/projects/${projectId}/bookmark`);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p._id !== projectId));
        toast.success('Removed project from bookmarks');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove bookmark');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove Codex Bookmark
  const handleRemoveCodexBookmark = async (entryId) => {
    setActionLoadingId(entryId);
    try {
      const res = await api.post(`/codex/${entryId}/bookmark`);
      if (res.success) {
        setCodexEntries((prev) => prev.filter((e) => e._id !== entryId));
        toast.success('Removed codex entry from bookmarks');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove bookmark');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bookmarks-container animate-fade-in">
      <div className="bookmarks-header">
        <h1>Saved <span className="grad-text">Bookmarks</span></h1>
        <p>Curated archive of exceptional developer projects and Codex engineering solutions.</p>
      </div>

      {/* Tabs */}
      <div className="bookmarks-tabs-nav">
        <button
          type="button"
          className={`bookmarks-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
          Bookmarked Projects ({projects.length})
        </button>

        <button
          type="button"
          className={`bookmarks-tab-btn ${activeTab === 'codex' ? 'active' : ''}`}
          onClick={() => setActiveTab('codex')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Bookmarked Codex ({codexEntries.length})
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: 'var(--space-4)' }}>Loading saved bookmarks...</p>
        </div>
      ) : activeTab === 'projects' ? (
        /* Tab: Projects */
        projects.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <h3>No Bookmarked Projects</h3>
            <p>Save projects to inspect their architecture and reference their implementations.</p>
            <Link to="/explore" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
              Explore Projects
            </Link>
          </div>
        ) : (
          <div className="bookmarks-grid animate-fade-in">
            {projects.map((proj) => (
              <div key={proj._id} className="bookmark-card">
                <div className="bookmark-card-top">
                  <span className="bookmark-category-badge">
                    {proj.category || 'Web App'}
                  </span>
                  <button
                    type="button"
                    className="bookmark-remove-btn"
                    title="Remove from bookmarks"
                    onClick={() => handleRemoveProjectBookmark(proj._id)}
                    disabled={actionLoadingId === proj._id}
                  >
                    {actionLoadingId === proj._id ? (
                      <span className="spinner" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                  </button>
                </div>

                <h3 className="bookmark-title">
                  <Link to={`/projects/${proj.slug || proj._id}`}>
                    {proj.title}
                  </Link>
                </h3>

                <p className="bookmark-desc">{proj.description}</p>

                <div className="bookmark-tags-row">
                  {proj.technologies && proj.technologies.slice(0, 4).map((tech, idx) => (
                    <span key={idx} className="bookmark-tag-pill">
                      #{tech}
                    </span>
                  ))}
                </div>

                <div className="bookmark-card-footer">
                  <div className="bookmark-author-info">
                    {proj.owner?.avatar ? (
                      <img src={proj.owner.avatar} alt={proj.owner.displayName} className="avatar avatar-sm" />
                    ) : (
                      <div className="avatar avatar-sm avatar-placeholder">
                        {(proj.owner?.displayName?.[0] || 'O').toUpperCase()}
                      </div>
                    )}
                    <span>{proj.owner?.displayName || 'Builder'}</span>
                  </div>

                  <Link to={`/projects/${proj.slug || proj._id}`} className="btn btn-secondary btn-sm">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab: Codex */
        codexEntries.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3>No Bookmarked Codex Entries</h3>
            <p>Save incident postmortems, debugging notes, and architectural lessons from senior engineers.</p>
            <Link to="/codex" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
              Browse Codex
            </Link>
          </div>
        ) : (
          <div className="bookmarks-grid animate-fade-in">
            {codexEntries.map((entry) => (
              <div key={entry._id} className="bookmark-card">
                <div className="bookmark-card-top">
                  <span className="bookmark-category-badge">
                    {entry.category || 'Architecture'}
                  </span>
                  <button
                    type="button"
                    className="bookmark-remove-btn"
                    title="Remove from bookmarks"
                    onClick={() => handleRemoveCodexBookmark(entry._id)}
                    disabled={actionLoadingId === entry._id}
                  >
                    {actionLoadingId === entry._id ? (
                      <span className="spinner" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                  </button>
                </div>

                <h3 className="bookmark-title">
                  <Link to={`/codex/${entry.slug || entry._id}`}>
                    {entry.title}
                  </Link>
                </h3>

                <p className="bookmark-desc">{entry.content}</p>

                <div className="bookmark-tags-row">
                  {entry.tags && entry.tags.slice(0, 4).map((tag, idx) => (
                    <span key={idx} className="bookmark-tag-pill">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="bookmark-card-footer">
                  <div className="bookmark-author-info">
                    {entry.author?.avatar ? (
                      <img src={entry.author.avatar} alt={entry.author.displayName} className="avatar avatar-sm" />
                    ) : (
                      <div className="avatar avatar-sm avatar-placeholder">
                        {(entry.author?.displayName?.[0] || 'A').toUpperCase()}
                      </div>
                    )}
                    <span>{entry.author?.displayName || 'Author'}</span>
                  </div>

                  <Link to={`/codex/${entry.slug || entry._id}`} className="btn btn-secondary btn-sm">
                    Read Codex
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
