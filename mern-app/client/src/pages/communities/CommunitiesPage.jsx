import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import './Communities.css';

const TOPICS = [
  { value: '', label: 'All Topics' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'devops', label: 'DevOps & Cloud' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'blockchain', label: 'Blockchain & Web3' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'design', label: 'UI/UX & Design' },
  { value: 'career', label: 'Career & Mentorship' },
  { value: 'general', label: 'General Tech' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Active' },
  { value: 'newest', label: 'Newest First' },
];

export default function CommunitiesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // State
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Track join/leave actions in flight per community
  const [actionInProgress, setActionInProgress] = useState({});

  // Debounced search
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch Communities
  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 12);
      if (topic) params.append('topic', topic);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (sortBy) params.append('sort', sortBy);

      const res = await api.get(`/communities?${params.toString()}`);
      const list = res.data || [];
      setCommunities(list);

      if (res.pagination) {
        setTotalPages(res.pagination.pages || 1);
        setTotalCount(res.pagination.total || 0);
      } else {
        setTotalPages(1);
        setTotalCount(list.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load communities');
      toast.error(err.message || 'Error loading communities');
    } finally {
      setLoading(false);
    }
  }, [currentPage, topic, debouncedSearch, sortBy, toast]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Check if current user is member of community
  const isUserMember = (community) => {
    if (!user || !community) return false;
    const currentUserId = (user._id || user.id).toString();
    if (Array.isArray(community.members)) {
      return community.members.some(
        (m) => (m._id || m).toString() === currentUserId
      );
    }
    return false;
  };

  // Handle Join / Leave Community
  const handleToggleMembership = async (e, community) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.info('Please sign in to join communities');
      return;
    }

    const commId = community._id;
    if (actionInProgress[commId]) return;

    const isMember = isUserMember(community);
    setActionInProgress((prev) => ({ ...prev, [commId]: true }));

    try {
      if (isMember) {
        // Leave
        const res = await api.post(`/communities/${commId}/leave`);
        const updatedCount = res.data?.membersCount ?? Math.max(0, (community.membersCount || 1) - 1);

        setCommunities((prev) =>
          prev.map((c) => {
            if (c._id === commId) {
              const currentMembers = Array.isArray(c.members) ? [...c.members] : [];
              const uId = (user._id || user.id).toString();
              return {
                ...c,
                members: currentMembers.filter((m) => (m._id || m).toString() !== uId),
                membersCount: updatedCount,
              };
            }
            return c;
          })
        );
        toast.info(`You left "${community.name}"`);
      } else {
        // Join
        const res = await api.post(`/communities/${commId}/join`);
        const updatedCount = res.data?.membersCount ?? ((community.membersCount || 0) + 1);

        setCommunities((prev) =>
          prev.map((c) => {
            if (c._id === commId) {
              const currentMembers = Array.isArray(c.members) ? [...c.members] : [];
              currentMembers.push(user._id || user.id);
              return {
                ...c,
                members: currentMembers,
                membersCount: updatedCount,
              };
            }
            return c;
          })
        );
        toast.success(`Joined "${community.name}"! 🚀`);
      }
    } catch (err) {
      toast.error(err.message || 'Membership update failed');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [commId]: false }));
    }
  };

  return (
    <div className="communities-page">
      <div className="communities-container">
        {/* Header */}
        <div className="communities-header">
          <div className="communities-header-left">
            <h1 className="communities-title">Developer Communities</h1>
            <p className="communities-subtitle">
              Join specialized developer groups, collaborate on technical challenges, share insights, and build together.
            </p>
          </div>
          <div className="communities-header-actions">
            <Link to="/communities/new" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Community</span>
            </Link>
          </div>
        </div>

        {/* Toolbar: Search, Topics, Sort */}
        <div className="communities-toolbar">
          <div className="communities-toolbar-top">
            <div className="communities-search-box">
              <span className="communities-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="communities-search-input"
                placeholder="Search communities by name or focus..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="communities-filter-selects">
              <select
                className="communities-select"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by topic"
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <select
                className="communities-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Sort communities"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Pills */}
          <div className="communities-topic-pills">
            {TOPICS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`topic-pill ${topic === t.value ? 'active' : ''}`}
                onClick={() => {
                  setTopic(t.value);
                  setCurrentPage(1);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="communities-results-count">
            Showing {communities.length} of {totalCount} communities
            {topic && ` in "${TOPICS.find((t) => t.value === topic)?.label}"`}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </div>
        )}

        {/* Content View */}
        {loading ? (
          <LoadingSpinner size="lg" message="Loading developer communities..." />
        ) : error ? (
          <EmptyState
            title="Failed to Load Communities"
            message={error}
            actionLabel="Try Again"
            onAction={fetchCommunities}
          />
        ) : communities.length === 0 ? (
          <EmptyState
            title="No communities found"
            message={
              debouncedSearch || topic
                ? 'Try adjusting your topic filter or search terms.'
                : 'Create the first technical community and gather peers around your favorite stack!'
            }
            actionLabel="Create Community"
            actionLink="/communities/new"
          />
        ) : (
          <>
            <div className="communities-grid">
              {communities.map((community) => {
                const member = isUserMember(community);
                const initial = (community.name ? community.name[0] : 'C').toUpperCase();
                const inFlight = actionInProgress[community._id];

                return (
                  <div
                    key={community._id}
                    className="community-card"
                    onClick={() => navigate(`/communities/${community.slug || community._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="community-card-top">
                      <div className="community-card-avatar">
                        {community.avatar ? (
                          <img src={community.avatar} alt={community.name} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="community-card-meta">
                        <h3 className="community-card-name">{community.name}</h3>
                        <span className="community-topic-badge">
                          {community.topic || 'General'}
                        </span>
                      </div>
                    </div>

                    <p className="community-card-desc">
                      {community.description || 'A vibrant developer space for discussion and code sharing.'}
                    </p>

                    <div className="community-card-footer">
                      <div className="community-members-count">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                        <span>
                          {community.membersCount ?? (Array.isArray(community.members) ? community.members.length : 1)} members
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`community-join-btn ${member ? 'joined' : 'join'}`}
                        onClick={(e) => handleToggleMembership(e, community)}
                        disabled={inFlight}
                      >
                        {inFlight ? (
                          <span>...</span>
                        ) : member ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Joined</span>
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Join</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
