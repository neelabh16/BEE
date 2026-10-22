import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import './Projects.css';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live like/bookmark state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [bookmarkInProgress, setBookmarkInProgress] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch project details
  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/slug/${slug}`);
      const data = res.data;
      setProject(data);
      setLikesCount(data.likesCount || 0);

      // Check like/bookmark status if user logged in
      if (user && data) {
        const currentUserId = (user._id || user.id).toString();
        const hasLiked = Array.isArray(data.likes) && data.likes.some(
          (uId) => (uId._id || uId).toString() === currentUserId
        );
        setIsLiked(hasLiked);

        const hasBookmarked = Array.isArray(data.bookmarks) && data.bookmarks.some(
          (uId) => (uId._id || uId).toString() === currentUserId
        );
        setIsBookmarked(hasBookmarked);
      }
    } catch (err) {
      setError(err.message || 'Project not found');
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!user) {
      toast.info('Please sign in to like projects');
      return;
    }
    if (!project || likeInProgress) return;

    setLikeInProgress(true);
    try {
      const res = await api.post(`/projects/${project._id}/like`);
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likesCount);
      toast.info(res.data.isLiked ? 'Project liked!' : 'Project unliked');
    } catch (err) {
      toast.error(err.message || 'Could not update like status');
    } finally {
      setLikeInProgress(false);
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async () => {
    if (!user) {
      toast.info('Please sign in to bookmark projects');
      return;
    }
    if (!project || bookmarkInProgress) return;

    setBookmarkInProgress(true);
    try {
      const res = await api.post(`/projects/${project._id}/bookmark`);
      setIsBookmarked(res.data.isBookmarked);
      toast.success(res.data.isBookmarked ? 'Saved to your bookmarks' : 'Removed from bookmarks');
    } catch (err) {
      toast.error(err.message || 'Could not update bookmark status');
    } finally {
      setBookmarkInProgress(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteProject = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success('Project deleted successfully');
      setShowDeleteModal(false);
      navigate('/explore');
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
      setDeleting(false);
    }
  };

  // Ownership Check
  const currentUserId = user ? (user._id || user.id).toString() : null;
  const ownerId = project?.owner ? (project.owner._id || project.owner).toString() : null;
  const isOwner = Boolean(user && ownerId && (currentUserId === ownerId || user.role === 'admin'));

  if (loading) {
    return (
      <div className="project-detail-page">
        <div className="project-detail-container">
          <LoadingSpinner size="lg" message="Loading project details..." />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-page">
        <div className="project-detail-container">
          <EmptyState
            title="Project Not Found"
            message={error || 'The project you are looking for does not exist or has been removed.'}
            actionLabel="Back to Explore"
            actionLink="/explore"
          />
        </div>
      </div>
    );
  }

  const owner = project.owner || {};
  const ownerName = owner.displayName || owner.username || 'Developer';
  const ownerInitial = (ownerName[0] || 'D').toUpperCase();

  return (
    <div className="project-detail-page">
      <div className="project-detail-container">
        {/* Breadcrumb Navigation */}
        <nav className="project-breadcrumb" aria-label="Breadcrumb">
          <Link to="/explore">Explore</Link>
          <span>/</span>
          <span className="text-muted">{project.category}</span>
          <span>/</span>
          <span className="text-dim">{project.title}</span>
        </nav>

        {/* Cover Banner if available */}
        {project.coverImage && (
          <div className="project-detail-hero">
            <img
              src={project.coverImage}
              alt={project.title}
              className="project-detail-cover"
            />
          </div>
        )}

        {/* Two-Column Grid: Main Details & Sidebar */}
        <div className="project-detail-layout">
          {/* Main Content Column */}
          <main className="project-detail-main">
            <header className="project-detail-header">
              <div className="project-detail-topbar">
                <div className="project-detail-badges">
                  <span className={`project-card-category-badge category-badge-${project.category || 'other'}`} style={{ position: 'static' }}>
                    {project.category || 'web'}
                  </span>
                  {project.status === 'draft' && (
                    <span className="badge badge-warning">Draft</span>
                  )}
                </div>

                {/* Published Date */}
                <span className="text-xs text-dim">
                  Published on {new Date(project.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="project-detail-title">{project.title}</h1>

              {/* Action Buttons: Live Demo & GitHub */}
              <div className="project-detail-links">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span>Live Demo</span>
                  </a>
                )}

                {project.githubUrl && (
                  <a
                    href={project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>View Source Code</span>
                  </a>
                )}
              </div>
            </header>

            {/* Description Body */}
            <section>
              <h2 className="project-detail-section-title">About the Project</h2>
              <div className="project-detail-description">
                {project.description}
              </div>
            </section>

            {/* Tech Stack Pills */}
            {Array.isArray(project.technologies) && project.technologies.length > 0 && (
              <section>
                <h2 className="project-detail-section-title">Technologies Used</h2>
                <div className="project-detail-tech-list">
                  {project.technologies.map((tech, idx) => (
                    <span key={idx} className="project-detail-tech-item">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar Column: Owner Info & Engagement Controls */}
          <aside className="project-detail-sidebar">
            {/* Owner Info Card */}
            <div className="project-owner-card">
              <div className="project-owner-card-header">
                <div className="project-owner-card-avatar">
                  {owner.avatar ? (
                    <img src={owner.avatar} alt={ownerName} />
                  ) : (
                    <span>{ownerInitial}</span>
                  )}
                </div>
                <div className="project-owner-card-info">
                  <h4>{owner.displayName || owner.username || 'Developer'}</h4>
                  <p>@{owner.username || 'user'}</p>
                  {owner.title && <span className="text-xs text-accent">{owner.title}</span>}
                </div>
              </div>

              {owner.bio && (
                <p className="project-owner-card-bio">
                  {owner.bio}
                </p>
              )}

              <Link
                to={`/profile/${owner.username || ''}`}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                View Profile
              </Link>
            </div>

            {/* Engagement & Action Card */}
            <div className="project-actions-card">
              <div className="project-actions-row">
                {/* Like Button */}
                <button
                  type="button"
                  className={`btn btn-secondary ${isLiked ? 'btn-danger' : ''}`}
                  style={{ flex: 1 }}
                  onClick={handleToggleLike}
                  disabled={likeInProgress}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{isLiked ? 'Liked' : 'Like'} ({likesCount})</span>
                </button>

                {/* Bookmark Button */}
                <button
                  type="button"
                  className={`btn btn-secondary ${isBookmarked ? 'btn-primary' : ''}`}
                  onClick={handleToggleBookmark}
                  disabled={bookmarkInProgress}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>

              {/* Owner Controls */}
              {isOwner && (
                <div className="project-owner-controls">
                  <span className="text-xs text-dim font-medium">Owner Controls</span>
                  <Link
                    to={`/projects/${project.slug}/edit`}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit Project</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete Project</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          danger
          title="Delete Project"
          message={`Are you sure you want to permanently delete "${project.title}"? All likes, bookmarks, and comments will be permanently erased.`}
          confirmLabel="Delete Project"
          cancelLabel="Cancel"
          loading={deleting}
          onConfirm={handleDeleteProject}
          onCancel={() => setShowDeleteModal(false)}
        />
      </div>
    </div>
  );
}
