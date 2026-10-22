import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import './Communities.css';

// Helper for relative timestamps
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reply form state
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete discussion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDiscussion, setDeletingDiscussion] = useState(false);

  // Delete reply tracking
  const [deletingReplyId, setDeletingReplyId] = useState(null);

  // Fetch Discussion
  const fetchDiscussion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/discussions/${id}`);
      setDiscussion(res.data);
    } catch (err) {
      setError(err.message || 'Discussion not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  // Submit Reply
  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    if (replyContent.trim().length > 3000) {
      toast.error('Reply content cannot exceed 3000 characters');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await api.post(`/discussions/${id}/replies`, {
        content: replyContent.trim(),
      });
      toast.success('Reply submitted!');
      setDiscussion(res.data);
      setReplyContent('');
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete Discussion
  const handleDeleteDiscussion = async () => {
    if (!discussion) return;
    setDeletingDiscussion(true);
    try {
      await api.delete(`/discussions/${discussion._id}`);
      toast.success('Discussion deleted');
      setShowDeleteModal(false);
      const communityTarget = discussion.community?.slug || discussion.community || '';
      if (communityTarget) {
        navigate(`/communities/${communityTarget}`);
      } else {
        navigate('/communities');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete discussion');
      setDeletingDiscussion(false);
    }
  };

  // Delete Reply
  const handleDeleteReply = async (replyId) => {
    if (!discussion || deletingReplyId) return;

    setDeletingReplyId(replyId);
    try {
      const res = await api.delete(`/discussions/${discussion._id}/replies/${replyId}`);
      toast.info('Reply removed');
      if (res.data) {
        setDiscussion(res.data);
      } else {
        setDiscussion((prev) => ({
          ...prev,
          replies: prev.replies.filter((r) => r._id !== replyId),
          repliesCount: Math.max(0, (prev.repliesCount || 1) - 1),
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete reply');
    } finally {
      setDeletingReplyId(null);
    }
  };

  if (loading) {
    return (
      <div className="discussion-detail-page">
        <div className="discussion-detail-container">
          <LoadingSpinner size="lg" message="Loading discussion..." />
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="discussion-detail-page">
        <div className="discussion-detail-container">
          <EmptyState
            title="Discussion Not Found"
            message={error || 'This discussion may have been removed.'}
            actionLabel="Browse Communities"
            actionLink="/communities"
          />
        </div>
      </div>
    );
  }

  const author = discussion.author || {};
  const authorName = author.displayName || author.username || 'Author';
  const authorInitial = (authorName[0] || 'A').toUpperCase();

  const currentUserId = user ? (user._id || user.id).toString() : null;
  const authorId = author._id ? author._id.toString() : author.toString();
  const isDiscussionAuthor = Boolean(user && (currentUserId === authorId || user.role === 'admin'));

  const communityLink = discussion.community?.slug
    ? `/communities/${discussion.community.slug}`
    : `/communities/${discussion.community || ''}`;

  return (
    <div className="discussion-detail-page">
      <div className="discussion-detail-container">
        {/* Navigation Breadcrumb */}
        <nav className="project-breadcrumb" aria-label="Breadcrumb">
          <Link to="/communities">Communities</Link>
          <span>/</span>
          <Link to={communityLink}>
            {discussion.community?.name || 'Community'}
          </Link>
          <span>/</span>
          <span className="text-dim">Discussion</span>
        </nav>

        {/* Main Discussion Card */}
        <article className="discussion-main-card">
          <header className="discussion-main-header">
            {discussion.isPinned && (
              <div className="discussion-header-badges">
                <span className="discussion-pinned-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                  Pinned Discussion
                </span>
              </div>
            )}

            <h1 className="discussion-main-title">{discussion.title}</h1>

            <div className="discussion-author-card">
              <div className="discussion-author-info">
                <div className="discussion-author-pic">
                  {author.avatar ? (
                    <img src={author.avatar} alt={authorName} />
                  ) : (
                    <span>{authorInitial}</span>
                  )}
                </div>
                <div className="discussion-author-names">
                  <h4>{authorName}</h4>
                  <p>
                    <Link to={`/profile/${author.username || ''}`} style={{ color: 'var(--text-secondary)' }}>
                      @{author.username || 'user'}
                    </Link>
                    {' '}&bull; {formatTimeAgo(discussion.createdAt)}
                  </p>
                </div>
              </div>

              {isDiscussionAuthor && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete</span>
                </button>
              )}
            </div>
          </header>

          {/* Discussion Content */}
          <div className="discussion-main-body">
            {discussion.content}
          </div>
        </article>

        {/* Replies Section */}
        <section className="replies-section">
          <div className="replies-header">
            <h2 className="replies-title">
              Replies ({discussion.replies?.length || 0})
            </h2>
          </div>

          {/* Add Reply Form */}
          {user ? (
            <div className="reply-form-card">
              <form onSubmit={handleAddReply}>
                <div className="form-group">
                  <label htmlFor="replyInput" className="form-label">
                    Join the conversation
                  </label>
                  <textarea
                    id="replyInput"
                    className="form-textarea"
                    rows={3}
                    placeholder="Write a constructive response or share your solution..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    maxLength={3000}
                    required
                  />
                </div>
                <div className="reply-form-footer">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submittingReply || !replyContent.trim()}
                  >
                    {submittingReply ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="dash-state-box" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p>Please log in to participate and post a reply in this discussion.</p>
              <Link to="/login" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Log In
              </Link>
            </div>
          )}

          {/* List of Replies */}
          {Array.isArray(discussion.replies) && discussion.replies.length > 0 ? (
            <div className="replies-list">
              {discussion.replies.map((reply) => {
                const replyAuthor = reply.author || {};
                const rName = replyAuthor.displayName || replyAuthor.username || 'User';
                const rInitial = (rName[0] || 'U').toUpperCase();

                const rAuthorId = replyAuthor._id
                  ? replyAuthor._id.toString()
                  : replyAuthor.toString();
                const canDeleteReply =
                  Boolean(user && (currentUserId === rAuthorId || isDiscussionAuthor || user.role === 'admin'));

                return (
                  <div key={reply._id} className="reply-item">
                    <div className="reply-item-header">
                      <div className="reply-item-author">
                        <div className="reply-author-pic">
                          {replyAuthor.avatar ? (
                            <img src={replyAuthor.avatar} alt={rName} />
                          ) : (
                            <span>{rInitial}</span>
                          )}
                        </div>
                        <div className="reply-author-details">
                          <span className="reply-author-name">{rName}</span>
                          <span className="reply-author-time">
                            @{replyAuthor.username || 'user'} &bull; {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                      </div>

                      {canDeleteReply && (
                        <button
                          type="button"
                          className="reply-delete-btn"
                          title="Delete reply"
                          onClick={() => handleDeleteReply(reply._id)}
                          disabled={deletingReplyId === reply._id}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="reply-item-content">
                      {reply.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dash-empty-state" style={{ padding: '2rem' }}>
              <p className="empty-desc">No replies yet. Be the first to chime in!</p>
            </div>
          )}
        </section>

        {/* Delete Discussion Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          danger
          title="Delete Discussion"
          message={`Are you sure you want to delete "${discussion.title}"? This will delete all replies permanently.`}
          confirmLabel="Delete Discussion"
          cancelLabel="Cancel"
          loading={deletingDiscussion}
          onConfirm={handleDeleteDiscussion}
          onCancel={() => setShowDeleteModal(false)}
        />
      </div>
    </div>
  );
}
