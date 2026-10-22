import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
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

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Community State
  const [community, setCommunity] = useState(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [communityError, setCommunityError] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);

  // Discussions State
  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [discussionsError, setDiscussionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiscussions, setTotalDiscussions] = useState(0);

  // New Discussion Form
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Community by slug
  const fetchCommunity = useCallback(async () => {
    setLoadingCommunity(true);
    setCommunityError(null);
    try {
      const res = await api.get(`/communities/slug/${slug}`);
      const data = res.data;
      setCommunity(data);

      if (user && data) {
        const currentUserId = (user._id || user.id).toString();
        const memberCheck = Array.isArray(data.members) && data.members.some(
          (m) => (m._id || m).toString() === currentUserId
        );
        setIsMember(memberCheck);
      }
    } catch (err) {
      setCommunityError(err.message || 'Failed to load community');
    } finally {
      setLoadingCommunity(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  // 2. Fetch Discussions for Community
  const fetchDiscussions = useCallback(async (communityId, page = 1) => {
    if (!communityId) return;
    setLoadingDiscussions(true);
    setDiscussionsError(null);
    try {
      const res = await api.get(`/discussions/community/${communityId}?page=${page}&limit=10`);
      setDiscussions(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.pages || 1);
        setTotalDiscussions(res.pagination.total || 0);
      }
    } catch (err) {
      setDiscussionsError(err.message || 'Failed to load discussions');
    } finally {
      setLoadingDiscussions(false);
    }
  }, []);

  useEffect(() => {
    if (community?._id) {
      fetchDiscussions(community._id, currentPage);
    }
  }, [community?._id, currentPage, fetchDiscussions]);

  // Handle Join / Leave
  const handleToggleMembership = async () => {
    if (!user) {
      toast.info('Please sign in to join this community');
      return;
    }
    if (!community || membershipLoading) return;

    setMembershipLoading(true);
    try {
      if (isMember) {
        const res = await api.post(`/communities/${community._id}/leave`);
        setIsMember(false);
        setCommunity((prev) => ({
          ...prev,
          membersCount: res.data?.membersCount ?? Math.max(0, (prev.membersCount || 1) - 1),
        }));
        toast.info(`You left "${community.name}"`);
      } else {
        const res = await api.post(`/communities/${community._id}/join`);
        setIsMember(true);
        setCommunity((prev) => ({
          ...prev,
          membersCount: res.data?.membersCount ?? ((prev.membersCount || 0) + 1),
        }));
        toast.success(`Joined "${community.name}"! 🚀`);
      }
    } catch (err) {
      toast.error(err.message || 'Could not update membership');
    } finally {
      setMembershipLoading(false);
    }
  };

  // Submit New Discussion
  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!discussionTitle.trim()) {
      errors.title = 'Discussion title is required';
    } else if (discussionTitle.trim().length > 200) {
      errors.title = 'Title must be 200 characters or fewer';
    }

    if (!discussionContent.trim()) {
      errors.content = 'Content is required';
    } else if (discussionContent.trim().length > 10000) {
      errors.content = 'Content must be 10000 characters or fewer';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmittingDiscussion(true);
    try {
      const payload = {
        title: discussionTitle.trim(),
        content: discussionContent.trim(),
        communityId: community._id,
      };

      const res = await api.post('/discussions', payload);
      toast.success('Discussion posted successfully! 💬');

      // Reset form
      setDiscussionTitle('');
      setDiscussionContent('');
      setShowNewDiscussionForm(false);
      setFormErrors({});

      // Prepend to discussions list
      setDiscussions((prev) => [res.data, ...prev]);
      setTotalDiscussions((prev) => prev + 1);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to create discussion');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  if (loadingCommunity) {
    return (
      <div className="community-detail-page">
        <div className="community-detail-container">
          <LoadingSpinner size="lg" message="Loading community..." />
        </div>
      </div>
    );
  }

  if (communityError || !community) {
    return (
      <div className="community-detail-page">
        <div className="community-detail-container">
          <EmptyState
            title="Community Not Found"
            message={communityError || 'The community does not exist or has been removed.'}
            actionLabel="Back to Communities"
            actionLink="/communities"
          />
        </div>
      </div>
    );
  }

  const initial = (community.name ? community.name[0] : 'C').toUpperCase();

  return (
    <div className="community-detail-page">
      <div className="community-detail-container">
        {/* Navigation Breadcrumb */}
        <nav className="project-breadcrumb" aria-label="Breadcrumb">
          <Link to="/communities">Communities</Link>
          <span>/</span>
          <span className="text-muted">{community.topic}</span>
          <span>/</span>
          <span className="text-dim">{community.name}</span>
        </nav>

        {/* Community Header Banner Card */}
        <div className="community-detail-header-card">
          <div className="community-detail-header-content">
            <div className="community-detail-header-left">
              <div className="community-detail-avatar">
                {community.avatar ? (
                  <img src={community.avatar} alt={community.name} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="community-detail-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1>{community.name}</h1>
                  <span className="community-topic-badge">{community.topic || 'General'}</span>
                </div>
                <p className="community-detail-desc">{community.description}</p>
                <div className="community-detail-stats">
                  <span>
                    <strong>{community.membersCount || 1}</strong> members
                  </span>
                  <span>&bull;</span>
                  <span>
                    <strong>{totalDiscussions}</strong> discussions
                  </span>
                  {community.owner && (
                    <>
                      <span>&bull;</span>
                      <span>
                        Founded by{' '}
                        <Link to={`/profile/${community.owner.username || ''}`} style={{ color: 'var(--accent-light)' }}>
                          @{community.owner.username}
                        </Link>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Join / Leave Actions */}
            <div className="community-detail-actions">
              <button
                type="button"
                className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleToggleMembership}
                disabled={membershipLoading}
              >
                {membershipLoading ? (
                  <span>Updating...</span>
                ) : isMember ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Joined (Leave)</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Join Community</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Discussions Header & Trigger */}
        <div className="community-discussions-header">
          <h2 className="community-discussions-title">Community Discussions</h2>
          {isMember ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewDiscussionForm((prev) => !prev)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{showNewDiscussionForm ? 'Cancel' : 'New Discussion'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleToggleMembership}
            >
              Join to Start Discussion
            </button>
          )}
        </div>

        {/* Embedded New Discussion Form */}
        {showNewDiscussionForm && isMember && (
          <div className="new-discussion-box">
            <h3 className="new-discussion-box-title">Start a New Discussion in {community.name}</h3>
            <form onSubmit={handleCreateDiscussion} noValidate>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="discussionTitle" className="form-label">
                  Discussion Title <span className="text-accent">*</span>
                </label>
                <input
                  id="discussionTitle"
                  type="text"
                  className={`form-input ${formErrors.title ? 'error' : ''}`}
                  placeholder="What question, topic, or insight do you want to share?"
                  value={discussionTitle}
                  onChange={(e) => {
                    setDiscussionTitle(e.target.value);
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: null }));
                  }}
                  maxLength={200}
                  required
                />
                {formErrors.title && <span className="form-error">{formErrors.title}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="discussionContent" className="form-label">
                  Content <span className="text-accent">*</span>
                </label>
                <textarea
                  id="discussionContent"
                  className={`form-textarea ${formErrors.content ? 'error' : ''}`}
                  rows={4}
                  placeholder="Provide context, code snippets, or background..."
                  value={discussionContent}
                  onChange={(e) => {
                    setDiscussionContent(e.target.value);
                    if (formErrors.content) setFormErrors((prev) => ({ ...prev, content: null }));
                  }}
                  maxLength={10000}
                  required
                />
                {formErrors.content && <span className="form-error">{formErrors.content}</span>}
              </div>

              <div className="new-discussion-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNewDiscussionForm(false)}
                  disabled={submittingDiscussion}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingDiscussion}
                >
                  {submittingDiscussion ? 'Publishing...' : 'Publish Discussion'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Discussions List */}
        {loadingDiscussions ? (
          <LoadingSpinner size="md" message="Loading discussions..." />
        ) : discussionsError ? (
          <EmptyState
            title="Failed to Load Discussions"
            message={discussionsError}
            actionLabel="Retry"
            onAction={() => fetchDiscussions(community._id, currentPage)}
          />
        ) : discussions.length === 0 ? (
          <EmptyState
            title="No discussions yet"
            message={`Be the first member to kick off a conversation in ${community.name}!`}
            actionLabel={isMember ? 'Start a Discussion' : 'Join Community'}
            onAction={isMember ? () => setShowNewDiscussionForm(true) : handleToggleMembership}
          />
        ) : (
          <>
            <div className="discussions-list">
              {discussions.map((item) => {
                const author = item.author || {};
                const authorName = author.displayName || author.username || 'Member';
                const authorInitial = (authorName[0] || 'M').toUpperCase();

                return (
                  <div
                    key={item._id}
                    className={`discussion-item ${item.isPinned ? 'pinned' : ''}`}
                    onClick={() => navigate(`/discussions/${item._id}`)}
                  >
                    {item.isPinned && (
                      <div className="discussion-item-top">
                        <span className="discussion-pinned-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                          </svg>
                          Pinned
                        </span>
                      </div>
                    )}

                    <h3 className="discussion-item-title">{item.title}</h3>

                    <div className="discussion-item-footer">
                      <div className="discussion-author-meta">
                        <div className="discussion-author-avatar">
                          {author.avatar ? (
                            <img src={author.avatar} alt={authorName} />
                          ) : (
                            <span>{authorInitial}</span>
                          )}
                        </div>
                        <span>@{author.username || 'member'}</span>
                        <span>&bull;</span>
                        <span>{formatTimeAgo(item.createdAt)}</span>
                      </div>

                      <div className="discussion-replies-pill">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>{item.repliesCount ?? (Array.isArray(item.replies) ? item.replies.length : 0)} replies</span>
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
                onPageChange={(p) => setCurrentPage(p)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
