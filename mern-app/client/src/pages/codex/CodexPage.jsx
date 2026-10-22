import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './Codex.css';

const CATEGORIES = [
  { id: 'all', label: 'All Entries' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'lessons', label: 'Lessons Learned' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'incidents', label: 'Incidents / Postmortems' },
  { id: 'performance', label: 'Performance' },
  { id: 'career', label: 'Career & Growth' },
  { id: 'mistakes', label: 'Mistakes & Pitfalls' },
  { id: 'practices', label: 'Best Practices' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CodexPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, pages: 1, total: 0 });
  const [bookmarkingId, setBookmarkingId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 12);
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (sort === 'popular') {
        params.append('sort', 'popular');
      }

      const res = await api.get(`/codex?${params.toString()}`);
      if (res.success) {
        setEntries(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load codex entries');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, selectedCategory, debouncedSearch, sort, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleBookmarkToggle = async (e, entryId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.warning('Please log in to bookmark entries');
      navigate('/login');
      return;
    }

    if (bookmarkingId) return;
    setBookmarkingId(entryId);

    try {
      const res = await api.post(`/codex/${entryId}/bookmark`);
      if (res.success && res.data) {
        const { isBookmarked, bookmarksCount } = res.data;
        setEntries(prev =>
          prev.map(item => {
            if (item._id === entryId) {
              const currentBookmarks = Array.isArray(item.bookmarks) ? [...item.bookmarks] : [];
              let nextBookmarks = currentBookmarks;
              if (isBookmarked) {
                if (!nextBookmarks.includes(user._id)) nextBookmarks.push(user._id);
              } else {
                nextBookmarks = nextBookmarks.filter(uid => uid !== user._id && uid?._id !== user._id);
              }
              return {
                ...item,
                bookmarksCount,
                bookmarks: nextBookmarks,
              };
            }
            return item;
          })
        );
        toast.success(isBookmarked ? 'Saved to bookmarks' : 'Bookmark removed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update bookmark');
    } finally {
      setBookmarkingId(null);
    }
  };

  return (
    <div className="codex-container">
      {/* Header */}
      <header className="codex-header">
        <div className="codex-header-top">
          <div className="codex-title-group">
            <div className="codex-icon-badge" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="9" y1="7" x2="15" y2="7" />
                <line x1="9" y1="11" x2="13" y2="11" />
              </svg>
            </div>
            <div>
              <h1>Dev Codex</h1>
              <p className="codex-header-desc">
                Real-world engineering knowledge, hard-won debugging tales, architecture insights, and technical lessons from developers in the field.
              </p>
            </div>
          </div>
          <Link to="/codex/new" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Write Codex Entry
          </Link>
        </div>
      </header>

      {/* Toolbar: Search, Sort, Categories */}
      <section className="codex-toolbar" aria-label="Filters and search">
        <div className="codex-search-row">
          <div className="codex-search-box">
            <span className="codex-search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="codex-search-input"
              placeholder="Search by keywords, bug descriptions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search codex entries"
            />
            {searchQuery && (
              <button
                type="button"
                className="codex-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="codex-sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            aria-label="Sort entries"
          >
            <option value="latest">Latest First</option>
            <option value="popular">Most Bookmarked</option>
          </select>
        </div>

        {/* Categories Bar */}
        <div className="codex-categories" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={selectedCategory === cat.id}
              className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content: Loading, Empty, or Grid */}
      {loading ? (
        <div className="codex-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="codex-card skeleton-card skeleton" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="card empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>No Codex Entries Found</h3>
          <p>
            {debouncedSearch || selectedCategory !== 'all'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Be the first developer to document a lesson, architecture decision, or debugging story!'}
          </p>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Link to="/codex/new" className="btn btn-primary">
              Write the First Entry
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="codex-grid">
            {entries.map((entry) => {
              const isBookmarked =
                Boolean(user) &&
                Array.isArray(entry.bookmarks) &&
                entry.bookmarks.some(b => (typeof b === 'object' ? b?._id === user._id : b === user._id));

              return (
                <article key={entry._id} className="codex-card">
                  <div>
                    <div className="codex-card-top">
                      <span className={`badge-category badge-cat-${entry.category}`}>
                        {entry.category}
                      </span>
                      <time className="codex-card-date" dateTime={entry.createdAt}>
                        {formatDate(entry.createdAt)}
                      </time>
                    </div>

                    <h2 className="codex-card-title">
                      <Link to={`/codex/${entry.slug}`}>{entry.title}</Link>
                    </h2>

                    <p className="codex-card-excerpt">
                      {entry.content}
                    </p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="codex-card-tags">
                        {entry.tags.map((tag, idx) => (
                          <span key={idx} className="codex-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <footer className="codex-card-footer">
                    <Link
                      to={`/profile/${entry.author?.username || ''}`}
                      className="codex-author"
                      title={entry.author?.displayName || 'Author profile'}
                    >
                      {entry.author?.avatar ? (
                        <img
                          src={entry.author.avatar}
                          alt={entry.author.displayName || 'Author'}
                          className="codex-author-avatar"
                        />
                      ) : (
                        <div className="codex-author-avatar-fallback">
                          {(entry.author?.displayName || entry.author?.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="codex-author-info">
                        <span className="codex-author-name">
                          {entry.author?.displayName || entry.author?.username || 'Anonymous'}
                        </span>
                        {entry.author?.title && (
                          <span className="codex-author-title">
                            {entry.author.title}
                          </span>
                        )}
                      </div>
                    </Link>

                    <button
                      type="button"
                      className={`btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
                      onClick={(e) => handleBookmarkToggle(e, entry._id)}
                      disabled={bookmarkingId === entry._id}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark entry'}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={isBookmarked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{entry.bookmarksCount || 0}</span>
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <nav className="codex-pagination" aria-label="Codex pagination">
              <button
                type="button"
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                ← Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pagination-btn ${pagination.page === p ? 'active' : ''}`}
                  onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="pagination-btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
