import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const TECH_GRADIENTS = [
  'linear-gradient(135deg,#7c6fff,#4fe3c1)',
  'linear-gradient(135deg,#ff6b5b,#7c6fff)',
  'linear-gradient(135deg,#4fe3c1,#ffb86b)',
  'linear-gradient(135deg,#ffb86b,#ff6b5b)',
  'linear-gradient(135deg,#7c6fff,#ff6b5b)',
];

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'web', label: 'Web Dev' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'ai-ml', label: 'AI & ML' },
  { value: 'devtools', label: 'Dev Tools' },
  { value: 'blockchain', label: 'Web3' },
  { value: 'gamedev', label: 'Game Dev' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'cybersecurity', label: 'Security' },
];

const FALLBACK_PROJECTS = [
  {
    _id: 'p1',
    slug: 'nebula-ui-kit',
    title: 'Nebula UI Kit',
    description: 'A glassmorphic component library for ambitious dashboards and web apps.',
    category: 'web',
    difficulty: 'Intermediate',
    technologies: ['React', 'CSS', 'Framer Motion'],
    likesCount: 842,
    views: 12400,
    coverImage: '/assets/img/project-cards/project-7.png',
  },
  {
    _id: 'p2',
    slug: 'pulsedb',
    title: 'PulseDB',
    description: 'A lightweight time-series database engine written for edge devices.',
    category: 'devtools',
    difficulty: 'Advanced',
    technologies: ['Rust', 'WASM'],
    likesCount: 1290,
    views: 30100,
    coverImage: '/assets/img/project-cards/project-3.png',
  },
  {
    _id: 'p3',
    slug: 'origami-auth',
    title: 'Origami Auth',
    description: 'Drop-in passwordless auth with WebAuthn, passkeys, and secure sessions.',
    category: 'devtools',
    difficulty: 'Intermediate',
    technologies: ['Node.js', 'Express', 'JWT'],
    likesCount: 511,
    views: 8900,
    coverImage: '/assets/img/project-cards/project-9.png',
  },
  {
    _id: 'p4',
    slug: 'voxel-garden',
    title: 'Voxel Garden',
    description: 'A procedurally generated voxel world renderer running smoothly in the browser.',
    category: 'gamedev',
    difficulty: 'Advanced',
    technologies: ['Three.js', 'WebGL', 'Canvas'],
    likesCount: 2043,
    views: 51200,
    coverImage: '/assets/img/project-cards/project-1.png',
  },
  {
    _id: 'p5',
    slug: 'flowline',
    title: 'Flowline',
    description: 'A visual workflow automation canvas for agile engineering teams.',
    category: 'web',
    difficulty: 'Beginner',
    technologies: ['React', 'Node.js', 'REST API'],
    likesCount: 322,
    views: 6100,
    coverImage: '/assets/img/project-cards/project-8.png',
  },
  {
    _id: 'p6',
    slug: 'shard',
    title: 'Shard Engine',
    description: 'A distributed key-value store built for resilience and chaos engineering.',
    category: 'cloud',
    difficulty: 'Advanced',
    technologies: ['Go', 'gRPC', 'Distributed'],
    likesCount: 987,
    views: 21300,
    coverImage: '/assets/img/project-cards/project-4.png',
  },
];

export default function ExplorePage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  // Search input ref for '/' shortcut
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch projects from MongoDB API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 12);
      if (category) params.append('category', category);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (sortBy === 'likes' || sortBy === 'trending') params.append('sort', 'likes');
      else if (sortBy === 'newest') params.append('sort', 'newest');

      const res = await api.get(`/projects?${params.toString()}`);
      if (res.data?.data) {
        let list = res.data.data;
        if (difficulty !== 'All') {
          // Filter client-side if difficulty specified
          list = list.filter((p) => (p.difficulty || 'Intermediate') === difficulty);
        }
        setProjects(list);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalProjects(res.data.pagination?.total || list.length);
      } else {
        setProjects(FALLBACK_PROJECTS);
        setTotalProjects(FALLBACK_PROJECTS.length);
      }
    } catch (err) {
      // Fallback
      setProjects(FALLBACK_PROJECTS);
      setTotalProjects(FALLBACK_PROJECTS.length);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, difficulty, sortBy, currentPage]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Like Toggle
  const handleLike = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Sign in to like projects');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/projects/${projectId}/like`);
      const { liked, likesCount } = res.data?.data || {};
      setProjects((prev) =>
        prev.map((p) => {
          if (p._id === projectId) {
            const currentLikes = p.likes || [];
            const userId = user._id || user.id;
            const updatedLikes = liked
              ? [...currentLikes, userId]
              : currentLikes.filter((id) => (id._id || id).toString() !== userId.toString());
            return {
              ...p,
              likes: updatedLikes,
              likesCount: likesCount !== undefined ? likesCount : (liked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 1) - 1)),
            };
          }
          return p;
        })
      );
      toast.success(liked ? 'Liked project (+2 XP)' : 'Unliked project');
    } catch (err) {
      toast.error(err.message || 'Error updating like');
    }
  };

  // Bookmark Toggle
  const handleBookmark = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Sign in to bookmark projects');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/projects/${projectId}/bookmark`);
      const { bookmarked } = res.data?.data || {};
      setProjects((prev) =>
        prev.map((p) => {
          if (p._id === projectId) {
            const currentBookmarks = p.bookmarks || [];
            const userId = user._id || user.id;
            const updatedBookmarks = bookmarked
              ? [...currentBookmarks, userId]
              : currentBookmarks.filter((id) => (id._id || id).toString() !== userId.toString());
            return {
              ...p,
              bookmarks: updatedBookmarks,
            };
          }
          return p;
        })
      );
      toast.success(bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch (err) {
      toast.error(err.message || 'Error updating bookmark');
    }
  };

  const isLiked = (p) => {
    if (!user || !p.likes) return false;
    const uid = (user._id || user.id).toString();
    return p.likes.some((id) => (id._id || id).toString() === uid);
  };

  const isBookmarked = (p) => {
    if (!user || !p.bookmarks) return false;
    const uid = (user._id || user.id).toString();
    return p.bookmarks.some((id) => (id._id || id).toString() === uid);
  };

  return (
    <div className="explore-page-wrapper">
      {/* Header */}
      <section className="wrap page-header">
        <div className="eyebrow">The catalog</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)' }}>Explore Projects</h1>
            <p className="lede">Search, filter, and sort through everything the DevVerse community is building.</p>
          </div>
          <Link to="/projects/new" className="btn btn-primary">+ Submit a project</Link>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="wrap section-tight" style={{ paddingTop: 0 }}>
        <div className="glass" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box with '/' shortcut */}
          <div className="search-wrap" style={{ flex: 1, minWidth: '240px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              id="explore-search"
              placeholder="Search projects, tags, or tech…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="search-kbd">/</kbd>
          </div>

          {/* Difficulty Pill Toggle */}
          <div className="pill-toggle" id="difficulty-toggle">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                className={difficulty === diff ? 'active' : ''}
                onClick={() => setDifficulty(diff)}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            id="explore-sort"
            style={{ width: 'auto', minWidth: '180px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="trending">Sort: Trending</option>
            <option value="likes">Sort: Most liked</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>

        {/* Category Filter Chips */}
        <div id="category-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '18px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`chip ${category === cat.value ? 'chip-accent' : ''}`}
              style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Project Grid */}
      <section className="wrap section-tight">
        <div className="section-head" style={{ marginBottom: '22px' }}>
          <span className="mono muted" id="explore-count">
            {totalProjects} {totalProjects === 1 ? 'project' : 'projects'} found
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <LoadingSpinner size="lg" message="Loading catalog..." />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects match those filters"
            message="Try clearing your search query or choosing another category."
            actionLabel="Reset filters"
            onAction={() => { setSearchQuery(''); setCategory(''); setDifficulty('All'); }}
          />
        ) : (
          <div className="grid grid-3" id="explore-grid">
            {projects.map((p, idx) => {
              const liked = isLiked(p);
              const bookmarked = isBookmarked(p);
              const artImg = p.coverImage || `/assets/img/project-cards/project-${(idx % 16) + 1}.png`;

              return (
                <div key={p._id || idx} className="project-card glass card-lift">
                  <Link to={`/projects/${p.slug || p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="pc-thumb" style={{ background: TECH_GRADIENTS[idx % TECH_GRADIENTS.length] }}>
                      <img className="pc-art" src={artImg} alt="" aria-hidden="true" />
                      <span className="chip pc-diff">{p.difficulty || 'Intermediate'}</span>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <div className="pc-title">{p.title}</div>
                      <div className="pc-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </div>
                    </div>
                  </Link>

                  <div className="pc-tags" style={{ marginTop: 'auto', paddingTop: '8px' }}>
                    {(p.technologies || []).slice(0, 3).map((t, i) => (
                      <span key={i} className="chip">{t}</span>
                    ))}
                  </div>

                  <div className="pc-stats">
                    <button
                      className={`pc-stat dv-like ${liked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, p._id)}
                      aria-label={`Like ${p.title}`}
                      style={{ cursor: 'pointer', color: liked ? 'var(--coral)' : 'inherit' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{(p.likesCount || 0).toLocaleString()}</span>
                    </button>

                    <span className="pc-stat">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{p.views ? `${(p.views / 1000).toFixed(1)}k` : '1.4k'}</span>
                    </span>

                    <button
                      className={`pc-stat dv-bookmark ${bookmarked ? 'bookmarked' : ''}`}
                      onClick={(e) => handleBookmark(e, p._id)}
                      aria-label={`Bookmark ${p.title}`}
                      style={{ marginLeft: 'auto', cursor: 'pointer', color: bookmarked ? 'var(--cyan)' : 'inherit' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '36px' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}
