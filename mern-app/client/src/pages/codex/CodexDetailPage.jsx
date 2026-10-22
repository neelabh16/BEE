import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import './Codex.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CodexDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEntry = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/codex/slug/${slug}`);
      if (res.success && res.data) {
        const item = res.data;
        setEntry(item);
        setBookmarksCount(item.bookmarksCount || 0);

        if (user && Array.isArray(item.bookmarks)) {
          const hasBookmarked = item.bookmarks.some(b =>
            typeof b === 'object' ? b?._id === user._id : b === user._id
          );
          setIsBookmarked(hasBookmarked);
        }
      } else {
        toast.error('Codex entry not found');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  }, [slug, user, toast]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast.warning('Please log in to bookmark entries');
      navigate('/login');
      return;
    }

    if (!entry || bookmarking) return;
    setBookmarking(true);

    try {
      const res = await api.post(`/codex/${entry._id}/bookmark`);
      if (res.success && res.data) {
        setIsBookmarked(res.data.isBookmarked);
        setBookmarksCount(res.data.bookmarksCount);
        toast.success(res.data.isBookmarked ? 'Entry bookmarked' : 'Bookmark removed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/codex/${entry._id}`);
      if (res.success) {
        toast.success('Codex entry deleted successfully');
        setIsDeleteModalOpen(false);
        navigate('/codex');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete entry');
      setDeleting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.info('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="codex-detail-container">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="skeleton skeleton-title" style={{ width: '120px', height: '20px' }} />
        </div>
        <div className="card skeleton-card skeleton" style={{ minHeight: '380px' }} />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="codex-detail-container">
        <div className="card empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Entry Not Found</h3>
          <p>The codex entry you are looking for may have been removed or does not exist.</p>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Link to="/codex" className="btn btn-secondary">
              ← Return to Codex
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = Boolean(
    user &&
    entry.author &&
    ((typeof entry.author === 'object' && entry.author._id === user._id) ||
      entry.author === user._id ||
      user.role === 'admin')
  );

  return (
    <div className="codex-detail-container animate-fade-in">
      {/* Back link */}
      <Link to="/codex" className="codex-back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Knowledge Base
      </Link>

      {/* Article Header */}
      <header className="codex-detail-header">
        <div className="codex-detail-meta-top">
          <span className={`badge-category badge-cat-${entry.category}`}>
            {entry.category}
          </span>
          <span className="text-dim">•</span>
          <time className="text-dim text-sm" dateTime={entry.createdAt}>
            Published on {formatDate(entry.createdAt)}
          </time>
        </div>

        <h1 className="codex-detail-title">{entry.title}</h1>

        {entry.tags && entry.tags.length > 0 && (
          <div className="codex-detail-tags">
            {entry.tags.map((tag, idx) => (
              <span key={idx} className="codex-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author Card & Actions Bar */}
        <div className="codex-detail-author-bar">
          <Link
            to={`/profile/${entry.author?.username || ''}`}
            className="author-card-left"
            title="View author profile"
          >
            {entry.author?.avatar ? (
              <img
                src={entry.author.avatar}
                alt={entry.author.displayName || 'Author'}
                className="author-large-avatar"
              />
            ) : (
              <div className="author-large-fallback">
                {(entry.author?.displayName || entry.author?.username || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="author-card-meta">
              <h4>{entry.author?.displayName || entry.author?.username || 'Anonymous'}</h4>
              <p>@{entry.author?.username} {entry.author?.title ? `• ${entry.author.title}` : ''}</p>
            </div>
          </Link>

          <div className="codex-detail-actions">
            <button
              type="button"
              className={`btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmarkToggle}
              disabled={bookmarking}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this entry'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>{bookmarksCount} Bookmarks</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleShare}
              title="Share link"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>

            {isAuthor && (
              <>
                <Link
                  to={`/codex/${entry.slug}/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </Link>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <article className="codex-content-body">
        {entry.content.split('\n\n').map((paragraph, index) => {
          const trimmed = paragraph.trim();
          if (!trimmed) return null;

          // Code block heuristic
          if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
            const lines = trimmed.split('\n');
            const codeContent = lines.slice(1, -1).join('\n');
            return (
              <pre key={index}>
                <code>{codeContent}</code>
              </pre>
            );
          }

          // Heading 2
          if (trimmed.startsWith('## ')) {
            return <h2 key={index}>{trimmed.replace(/^##\s+/, '')}</h2>;
          }

          // Heading 3
          if (trimmed.startsWith('### ')) {
            return <h3 key={index}>{trimmed.replace(/^###\s+/, '')}</h3>;
          }

          // Blockquote
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={index}>
                {trimmed.replace(/^>\s*/gm, '')}
              </blockquote>
            );
          }

          // Unordered list
          if (trimmed.split('\n').every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
            return (
              <ul key={index}>
                {trimmed.split('\n').map((line, liIdx) => (
                  <li key={liIdx}>{line.replace(/^[-*]\s+/, '')}</li>
                ))}
              </ul>
            );
          }

          // Regular paragraph (retains line breaks)
          return (
            <p key={index}>
              {trimmed.split('\n').map((subLine, sIdx) => (
                <span key={sIdx}>
                  {subLine}
                  {sIdx < trimmed.split('\n').length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        })}
      </article>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Codex Entry"
        message={`Are you sure you want to permanently delete "${entry.title}"? This action cannot be undone.`}
        confirmLabel="Delete Entry"
        cancelLabel="Keep Entry"
        danger={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
