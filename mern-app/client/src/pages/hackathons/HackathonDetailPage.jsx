import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Hackathons.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HackathonDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [hackathon, setHackathon] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHackathonData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await api.get(`/hackathons/slug/${slug}`);
      } catch (err) {
        // Fallback: try by ID if slug not found
        res = await api.get(`/hackathons/${slug}`);
      }

      if (res.success && res.data) {
        const hData = res.data;
        setHackathon(hData);

        // Check if user is registered
        const currentUserId = user?._id || user?.id;
        if (currentUserId && Array.isArray(hData.participants)) {
          const registered = hData.participants.some(
            (p) => (typeof p === 'string' ? p === currentUserId : p._id === currentUserId)
          );
          setIsRegistered(registered);
        }

        // Fetch participants list preview
        try {
          const partRes = await api.get(`/hackathons/${hData._id}/participants?limit=6`);
          if (partRes.success && Array.isArray(partRes.data)) {
            setParticipants(partRes.data);
          }
        } catch {
          // If participants endpoint fails, fallback to populated participants if any
        }
      }
    } catch (err) {
      setError(err.message || 'Hackathon not found');
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchHackathonData();
  }, [fetchHackathonData]);

  // Handle register / unregister
  const handleToggleRegistration = async () => {
    if (!user) {
      toast.warning('Please log in to register for hackathons');
      navigate('/login');
      return;
    }

    if (!hackathon) return;
    setActionLoading(true);

    try {
      if (isRegistered) {
        const res = await api.post(`/hackathons/${hackathon._id}/unregister`);
        if (res.success) {
          setIsRegistered(false);
          setHackathon((prev) => ({
            ...prev,
            participantsCount: Math.max(0, (prev.participantsCount || 1) - 1),
          }));
          toast.success('Successfully unregistered from hackathon');
        }
      } else {
        const res = await api.post(`/hackathons/${hackathon._id}/register`);
        if (res.success) {
          setIsRegistered(true);
          setHackathon((prev) => ({
            ...prev,
            participantsCount: (prev.participantsCount || 0) + 1,
          }));
          toast.success('Registered successfully! You are in.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Registration action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete hackathon
  const handleDelete = async () => {
    if (!hackathon) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/hackathons/${hackathon._id}`);
      if (res.success) {
        toast.success('Hackathon removed successfully');
        navigate('/hackathons');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete hackathon');
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="hackathon-detail-container">
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: 'var(--space-4)' }}>Loading hackathon details...</p>
        </div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="hackathon-detail-container">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Hackathon Not Found</h3>
          <p>{error || "The hackathon you're looking for doesn't exist or has ended."}</p>
          <Link to="/hackathons" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
            Back to Hackathons
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer =
    user && (user._id === hackathon.organizer?._id || user.id === hackathon.organizer?._id || user.role === 'admin');

  const statusClass =
    hackathon.status === 'active'
      ? 'status-active'
      : hackathon.status === 'upcoming'
      ? 'status-upcoming'
      : 'status-completed';

  const isPast = new Date(hackathon.endDate) < new Date();

  return (
    <div className="hackathon-detail-container animate-fade-in">
      {/* Back Link */}
      <Link to="/hackathons" className="hackathon-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to All Hackathons
      </Link>

      {/* Hero Banner */}
      <div className="hackathon-detail-hero">
        {hackathon.coverImage ? (
          <img
            src={hackathon.coverImage}
            alt={hackathon.title}
            className="hackathon-banner-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="hackathon-banner-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
            </svg>
          </div>
        )}

        <div className="hackathon-hero-content">
          <div className="hackathon-hero-primary">
            <div className="hackathon-hero-badges">
              <span className={`hackathon-status-tag ${statusClass}`}>
                {hackathon.status === 'active' ? '● Live Now' : hackathon.status}
              </span>
              <span className="badge">{hackathon.category || 'Open Track'}</span>
              <span className="badge badge-info">{hackathon.difficulty || 'All Levels'}</span>
            </div>

            <h1 className="hackathon-detail-title">{hackathon.title}</h1>

            <div className="hackathon-organizer-bar">
              {hackathon.organizer?.avatar ? (
                <img
                  src={hackathon.organizer.avatar}
                  alt={hackathon.organizer.displayName}
                  className="avatar avatar-sm"
                />
              ) : (
                <div className="avatar avatar-sm avatar-placeholder">
                  {(hackathon.organizer?.displayName?.[0] || 'O').toUpperCase()}
                </div>
              )}
              <span>
                Organized by{' '}
                <Link
                  to={`/profile/${hackathon.organizer?.username || ''}`}
                  className="hackathon-organizer-link"
                >
                  {hackathon.organizer?.displayName || 'DevVerse Host'}
                </Link>
                {hackathon.organizer?.title ? ` • ${hackathon.organizer.title}` : ''}
              </span>
            </div>
          </div>

          <div className="hackathon-hero-actions">
            <div className="hackathon-participant-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>
                <strong>{hackathon.participantsCount || hackathon.participants?.length || 0}</strong>{' '}
                Registered
                {hackathon.maxParticipants > 0 ? ` (Max ${hackathon.maxParticipants})` : ''}
              </span>
            </div>

            {isPast ? (
              <button type="button" className="btn btn-secondary" disabled>
                Hackathon Concluded
              </button>
            ) : isRegistered ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleToggleRegistration}
                disabled={actionLoading}
              >
                {actionLoading ? <span className="spinner" /> : '✓ Registered (Leave Hackathon)'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleToggleRegistration}
                disabled={
                  actionLoading ||
                  (hackathon.maxParticipants > 0 &&
                    (hackathon.participantsCount || 0) >= hackathon.maxParticipants)
                }
              >
                {actionLoading ? <span className="spinner" /> : 'Register Now'}
              </button>
            )}

            {isOrganizer && (
              <div className="hackathon-owner-controls">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Hackathon
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-column Layout */}
      <div className="hackathon-detail-layout">
        {/* Main Content Area */}
        <div className="hackathon-main-content">
          {/* Description */}
          <div className="hackathon-section-card">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              About the Hackathon
            </h2>
            <div className="hackathon-prose">{hackathon.description}</div>
          </div>

          {/* Rules */}
          {hackathon.rules && (
            <div className="hackathon-section-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Rules & Guidelines
              </h2>
              <div className="hackathon-prose">{hackathon.rules}</div>
            </div>
          )}

          {/* Judging Criteria */}
          {hackathon.judgingCriteria && (
            <div className="hackathon-section-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Judging Criteria
              </h2>
              <div className="hackathon-prose">{hackathon.judgingCriteria}</div>
            </div>
          )}

          {/* Prizes */}
          {hackathon.prizes && (
            <div className="hackathon-section-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                Prizes & Recognition
              </h2>
              <div className="hackathon-prose">{hackathon.prizes}</div>
            </div>
          )}

          {/* Technologies */}
          {hackathon.technologies && hackathon.technologies.length > 0 && (
            <div className="hackathon-section-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Featured Technologies
              </h2>
              <div className="hackathon-tech-tags">
                {hackathon.technologies.map((tech, idx) => (
                  <span key={idx} className="tech-tag-pill">
                    #{tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hackathon-sidebar">
          {/* Quick Facts */}
          <div className="hackathon-sidebar-card">
            <h3>Event Timeline</h3>
            <div className="hackathon-quick-facts">
              <div className="fact-row">
                <span className="fact-label">Starts</span>
                <span className="fact-val">{formatDate(hackathon.startDate)}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Ends</span>
                <span className="fact-val">{formatDate(hackathon.endDate)}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Format</span>
                <span className="fact-val">Online / DevVerse</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Difficulty</span>
                <span className="fact-val" style={{ textTransform: 'capitalize' }}>
                  {hackathon.difficulty || 'All Levels'}
                </span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Capacity</span>
                <span className="fact-val">
                  {hackathon.maxParticipants > 0 ? `${hackathon.maxParticipants} builders` : 'Unlimited'}
                </span>
              </div>
            </div>
          </div>

          {/* Squad Teammates callout */}
          <div className="hackathon-sidebar-card" style={{ background: 'var(--accent-softer)', borderColor: 'var(--accent-soft)' }}>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Need a Squad?
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Looking for frontend, backend, or AI teammates to build your hackathon project? Find them in Squad Finder.
            </p>
            <Link to="/squads" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Find Teammates
            </Link>
          </div>

          {/* Participants Preview */}
          <div className="hackathon-sidebar-card">
            <h3>Registered Builders ({participants.length})</h3>
            {participants.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                No participants yet. Be the first to register!
              </p>
            ) : (
              <div className="participants-preview-grid">
                {participants.map((p) => (
                  <Link
                    key={p._id}
                    to={`/profile/${p.username}`}
                    className="participant-item"
                  >
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.displayName} className="avatar avatar-sm" />
                    ) : (
                      <div className="avatar avatar-sm avatar-placeholder">
                        {(p.displayName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div className="participant-info">
                      <span className="participant-name">{p.displayName}</span>
                      <span className="participant-handle">@{p.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Hackathon</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Are you sure you want to permanently delete <strong>"{hackathon.title}"</strong>? All registered participants and submission data will be removed. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <span className="spinner" /> : 'Yes, Delete Hackathon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
