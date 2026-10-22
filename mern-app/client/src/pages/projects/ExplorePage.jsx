import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import './Projects.css';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Apps' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'blockchain', label: 'Blockchain & Web3' },
  { value: 'gamedev', label: 'Game Development' },
  { value: 'iot', label: 'Internet of Things' },
  { value: 'cloud', label: 'Cloud & DevOps' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'data', label: 'Data Science' },
  { value: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'likes', label: 'Most Popular' },
];

export default function ExplorePage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  // Track button action in flight
  const [actionInProgress, setActionInProgress] = useState({});

  // Debounce search input
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

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 12);
      if (category) params.append('category', category);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (sortBy) params.append('sort', sortBy);

      const res = await api.get(`/projects?${params.toString()}`);
      const data = res.data || [];
      setProjects(data);

      if (res.pagination) {
        setTotalPages(res.pagination.pages || 1);
        setTotalProjects(res.pagination.total || 0);
      } else {
        setTotalPages(1);
        setTotalProjects(data.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load projects');
      toast.error(err.message || 'Error loading projects');
    } finally {
      setLoading(false);
    }
  }, [currentPage, category, debouncedSearch, sortBy, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle Like Toggle
  const handleToggleLike = async (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.info('Please sign in to like projects');
      return;
    }

    if (actionInProgress[`like-${projectId}`]) return;

    setActionInProgress((prev) => ({ ...prev, [`like-${projectId}`]: true }));
    try {
      const res = await api.post(`/projects/${projectId}/like`);
      const { isLiked, likesCount } = res.data;

      setProjects((prev) =>
        prev.map((proj) => {
          if (proj._id === projectId) {
            const currentLikes = Array.isArray(proj.likes) ? [...proj.likes] : [];
            const userIdx = currentLikes.findIndex(
              (uId) => (uId._id || uId).toString() === (user._id || user.id).toString()
            );

            if (isLiked && userIdx === -1) {
              currentLikes.push(user._id || user.id);
            } else if (!isLiked && userIdx !== -1) {
              currentLikes.splice(userIdx, 1);
            }

            return {
              ...proj,
              likes: currentLikes,
              likesCount: likesCount !== undefined ? likesCount : proj.likesCount,
            };
          }
          return proj;
        })
      );
    } catch (err) {
      toast.error(err.message || 'Could not update like status');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [`like-${projectId}`]: false }));
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.info('Please sign in to bookmark projects');
      return;
    }

    if (actionInProgress[`bm-${projectId}`]) return;

    setActionInProgress((prev) => ({ ...prev, [`bm-${projectId}`]: true }));
    try {
      const res = await api.post(`/projects/${projectId}/bookmark`);
      const { isBookmarked } = res.data;

      setProjects((prev) =>
        prev.map((proj) => {
          if (proj._id === projectId) {
            const currentBookmarks = Array.isArray(proj.bookmarks) ? [...proj.bookmarks] : [];
            const userIdx = currentBookmarks.findIndex(
              (uId) => (uId._id || uId).toString() === (user._id || user.id).toString()
            );

            if (isBookmarked && userIdx === -1) {
              currentBookmarks.push(user._id || user.id);
            } else if (!isBookmarked && userIdx !== -1) {
              currentBookmarks.splice(userIdx, 1);
            }

            return {
              ...proj,
              bookmarks: currentBookmarks,
            };
          }
          return proj;
        })
      );

      toast.success(isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
    } catch (err) {
      toast.error(err.message || 'Could not update bookmark status');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [`bm-${projectId}`]: false }));
    }
  };

  const isUserLiked = (project) => {
    if (!user || !project.likes) return false;
    const currentUserId = (user._id || user.id).toString();
    return project.likes.some((id) => (id._id || id).toString() === currentUserId);
  };

  const isUserBookmarked = (project) => {
    if (!user || !project.bookmarks) return false;
    const currentUserId = (user._id || user.id).toString();
    return project.bookmarks.some((id) => (id._id || id).toString() === currentUserId);
  };

  return (
    <div className="projects-page">
      <div className="projects-container">
        {/* Header */}
        <div className="projects-header">
          <div className="projects-header-left">
            <h1 className="projects-title">Explore Developer Projects</h1>
            <p className="projects-subtitle">
              Discover real-world applications, open-source libraries, and innovative tools crafted by developers around the world.
            </p>
          </div>
          <div className="projects-header-actions">
            <Link to="/projects/new" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Submit Project</span>
            </Link>
          </div>
        </div>

        {/* Toolbar: Search, Category, Sort */}
        <div className="projects-toolbar">
          <div className="projects-toolbar-top">
            <div className="projects-search-box">
              <span className="projects-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="projects-search-input"
                placeholder="Search projects by title, description, or tech stack..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="projects-filter-selects">
              <div className="projects-select-wrapper">
                <select
                  className="projects-select"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="projects-select-wrapper">
                <select
                  className="projects-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Sort projects"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills for quick filtering */}
          <div className="projects-category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`category-pill ${category === cat.value ? 'active' : ''}`}
                onClick={() => {
                  setCategory(cat.value);
                  setCurrentPage(1);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stats */}
        {!loading && (
          <div className="projects-results-count">
            Showing {projects.length} of {totalProjects} projects
            {category && ` in "${CATEGORIES.find((c) => c.value === category)?.label}"`}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <LoadingSpinner size="lg" message="Loading creative projects..." />
        ) : error ? (
          <EmptyState
            title="Failed to Load Projects"
            message={error}
            actionLabel="Try Again"
            onAction={fetchProjects}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects found"
            message={
              debouncedSearch || category
                ? 'Try adjusting your search filters or clearing categories.'
                : 'Be the first developer to showcase a project on DevVerse!'
            }
            actionLabel="Submit a Project"
            actionLink="/projects/new"
          />
        ) : (
          <>
            <div className="projects-grid">
              {projects.map((project) => {
                const liked = isUserLiked(project);
                const bookmarked = isUserBookmarked(project);
                const owner = project.owner || {};
                const ownerName = owner.displayName || owner.username || 'Anonymous';
                const ownerInitial = (ownerName[0] || 'D').toUpperCase();

                return (
                  <div
                    key={project._id}
                    className="project-card"
                    onClick={() => navigate(`/projects/${project.slug || project._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Cover Image */}
                    <div className="project-card-cover">
                      {project.coverImage ? (
                        <img src={project.coverImage} alt={project.title} loading="lazy" />
                      ) : (
                        <div className="project-cover-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                        </div>
                      )}
                      <span className={`project-card-category-badge category-badge-${project.category || 'other'}`}>
                        {project.category || 'web'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="project-card-body">
                      <h3 className="project-card-title">
                        <Link
                          to={`/projects/${project.slug || project._id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.title}
                        </Link>
                      </h3>

                      <p className="project-card-desc">
                        {project.description || 'No description provided.'}
                      </p>

                      {/* Tech Pills */}
                      {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                        <div className="project-card-tech">
                          {project.technologies.slice(0, 4).map((tech, idx) => (
                            <span key={idx} className="project-tech-badge">
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 4 && (
                            <span className="project-tech-badge">
                              +{project.technologies.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: Owner & Actions */}
                      <div className="project-card-footer">
                        <Link
                          to={`/profile/${owner.username || ''}`}
                          className="project-owner-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="project-owner-avatar">
                            {owner.avatar ? (
                              <img src={owner.avatar} alt={ownerName} />
                            ) : (
                              <span>{ownerInitial}</span>
                            )}
                          </div>
                          <span className="project-owner-name">@{owner.username || 'user'}</span>
                        </Link>

                        <div className="project-card-actions">
                          {/* Like Button */}
                          <button
                            type="button"
                            className={`project-action-btn ${liked ? 'active-like' : ''}`}
                            onClick={(e) => handleToggleLike(e, project._id)}
                            title={liked ? 'Unlike project' : 'Like project'}
                            disabled={actionInProgress[`like-${project._id}`]}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{project.likesCount || 0}</span>
                          </button>

                          {/* Bookmark Button */}
                          <button
                            type="button"
                            className={`project-action-btn ${bookmarked ? 'active-bookmark' : ''}`}
                            onClick={(e) => handleToggleBookmark(e, project._id)}
                            title={bookmarked ? 'Remove bookmark' : 'Bookmark project'}
                            disabled={actionInProgress[`bm-${project._id}`]}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
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
