import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Hackathons.css';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Apps' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'blockchain', label: 'Blockchain & Web3' },
  { value: 'iot', label: 'IoT & Hardware' },
  { value: 'open', label: 'Open Track' },
  { value: 'social-good', label: 'Social Good' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
];

const DIFFICULTIES = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'all-levels', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner Friendly' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All Events' },
  { value: 'active', label: 'Live Now' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Concluded' },
];

function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return '';
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export default function HackathonsPage() {
  const toast = useToast();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 1,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch hackathons
  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 9);

      if (status !== 'all') params.append('status', status);
      if (category !== 'all') params.append('category', category);
      if (difficulty !== 'all') params.append('difficulty', difficulty);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const res = await api.get(`/hackathons?${params.toString()}`);
      if (res.success) {
        setHackathons(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load hackathons');
      toast.error(err.message || 'Error fetching hackathons');
    } finally {
      setLoading(false);
    }
  }, [page, status, category, difficulty, debouncedSearch, toast]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const handleResetFilters = () => {
    setStatus('all');
    setCategory('all');
    setDifficulty('all');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="hackathons-page-wrap">
      {/* Hero Header */}
      <section className="wrap page-header">
        <div className="page-header-flex">
          <div className="page-header-text">
            <div className="eyebrow">Compete &amp; win</div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)' }}>Hackathons</h1>
            <p className="lede">
              Ship something in a weekend. Win prizes. Meet your next co-founder.
            </p>
          </div>
          <div className="page-header-actions">
            <Link to="/hackathons/new" className="btn btn-primary">
              + Host Hackathon
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap section-tight" style={{ paddingTop: 0 }}>

      {/* Filter Toolbar */}
      <div className="hackathons-filters">
        <div className="hackathons-filters-row">
          {/* Status Pills */}
          <div className="hackathon-status-pills">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`status-pill ${status === tab.value ? 'active' : ''}`}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hackathons-search-group">
            <svg className="hackathons-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="hackathons-search-input"
              placeholder="Search hackathons, tech, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="hackathons-filters-row">
          <div className="hackathons-selects-row">
            <select
              className="filter-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
            >
              {DIFFICULTIES.map((dif) => (
                <option key={dif.value} value={dif.value}>
                  {dif.label}
                </option>
              ))}
            </select>

            {(status !== 'all' || category !== 'all' || difficulty !== 'all' || search) && (
              <button
                type="button"
                className="filter-reset-btn"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-dim text-xs font-mono">
            {pagination.total} {pagination.total === 1 ? 'hackathon' : 'hackathons'} found
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: 'var(--space-4)' }}>Discovering hackathons...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Failed to load hackathons</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 'var(--space-4)' }}
            onClick={fetchHackathons}
          >
            Try Again
          </button>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h3>No hackathons found</h3>
          <p>We couldn't find any hackathons matching your selected criteria. Try adjusting your filters or hosting your own!</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
            >
              Clear Filters
            </button>
            <Link to="/hackathons/new" className="btn btn-primary btn-sm">
              Host a Hackathon
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="hackathons-grid">
            {hackathons.map((hackathon) => {
              const statusClass =
                hackathon.status === 'active'
                  ? 'status-active'
                  : hackathon.status === 'upcoming'
                  ? 'status-upcoming'
                  : 'status-completed';

              return (
                <div key={hackathon._id} className="hackathon-card">
                  {/* Media Cover */}
                  <div className="hackathon-card-media">
                    <div className="hackathon-badge-group">
                      <span className={`hackathon-status-tag ${statusClass}`}>
                        {hackathon.status === 'active' ? '● Live' : hackathon.status}
                      </span>
                    </div>

                    {hackathon.coverImage ? (
                      <img
                        src={hackathon.coverImage}
                        alt={hackathon.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    <div
                      className="hackathon-card-placeholder"
                      style={{ display: hackathon.coverImage ? 'none' : 'flex' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
                      </svg>
                      <span>DevVerse Sprint</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="hackathon-card-body">
                    <div className="hackathon-card-meta">
                      <span className="hackathon-category-pill">
                        {hackathon.category || 'General'}
                      </span>
                      <span className="hackathon-difficulty-pill">
                        {hackathon.difficulty || 'All Levels'}
                      </span>
                    </div>

                    <h3 className="hackathon-card-title">
                      <Link to={`/hackathons/${hackathon.slug || hackathon._id}`}>
                        {hackathon.title}
                      </Link>
                    </h3>

                    <p className="hackathon-card-desc">
                      {hackathon.description}
                    </p>

                    <div className="hackathon-card-info-rows">
                      <div className="hackathon-info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span>
                      </div>

                      <div className="hackathon-info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>
                          {hackathon.participantsCount || hackathon.participants?.length || 0}
                          {hackathon.maxParticipants > 0 ? ` / ${hackathon.maxParticipants}` : ''} builders registered
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="hackathon-card-footer">
                      <div className="hackathon-organizer-small">
                        {hackathon.organizer?.avatar ? (
                          <img
                            src={hackathon.organizer.avatar}
                            alt={hackathon.organizer.displayName || 'Organizer'}
                            className="avatar-sm"
                          />
                        ) : (
                          <div className="avatar avatar-sm avatar-placeholder">
                            {(hackathon.organizer?.displayName?.[0] || 'O').toUpperCase()}
                          </div>
                        )}
                        <span>{hackathon.organizer?.displayName || 'Organizer'}</span>
                      </div>

                      <Link
                        to={`/hackathons/${hackathon.slug || hackathon._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                ‹
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="page-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
      </section>
    </div>
  );
}
