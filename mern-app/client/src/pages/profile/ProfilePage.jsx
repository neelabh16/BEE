import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Profile.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');

  // Squad request modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const [connectGoals, setConnectGoals] = useState('Hackathon Team');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Message direct state
  const [messageLoading, setMessageLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/users/profile/${username}`);
      if (res.success && res.data) {
        const uData = res.data;
        setProfile(uData);
        setProjects(Array.isArray(uData.projects) ? uData.projects : []);

        // Fetch recent activities
        try {
          const actRes = await api.get(`/users/${uData._id}/activities?limit=15`);
          if (actRes.success && Array.isArray(actRes.data)) {
            setActivities(actRes.data);
          }
        } catch {
          // Activities optional fallback
        }
      }
    } catch (err) {
      setError(err.message || 'Developer profile not found');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isOwnProfile =
    currentUser &&
    (currentUser.username === username || currentUser._id === profile?._id || currentUser.id === profile?._id);

  // Handle direct message
  const handleStartConversation = async () => {
    if (!currentUser) {
      toast.warning('Please log in to send messages');
      navigate('/login');
      return;
    }
    if (!profile) return;

    setMessageLoading(true);
    try {
      const res = await api.post('/conversations', { recipientId: profile._id });
      if (res.success && res.data) {
        navigate(`/messages/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to start conversation');
    } finally {
      setMessageLoading(false);
    }
  };

  // Handle send squad connect request
  const handleSendSquadRequest = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.warning('Please log in to connect with teammates');
      navigate('/login');
      return;
    }

    setSendingRequest(true);
    try {
      const res = await api.post('/squads/request', {
        receiverId: profile._id,
        message: connectMessage.trim(),
        goals: connectGoals.trim(),
      });

      if (res.success) {
        toast.success(`Squad connection request sent to ${profile.displayName}!`);
        setShowConnectModal(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send squad request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: 'var(--space-4)' }}>Loading developer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-container">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Profile Not Found</h3>
          <p>{error || "We couldn't find a developer matching that username."}</p>
          <Link to="/squads" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
            Find Other Developers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container animate-fade-in">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-cover-strip" />

        <div className="profile-card-content">
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrapper">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.displayName}
                  className="profile-main-avatar"
                />
              ) : (
                <div className="profile-main-avatar avatar-placeholder" style={{ fontSize: '2rem' }}>
                  {(profile.displayName?.[0] || 'D').toUpperCase()}
                </div>
              )}
            </div>

            <div className="profile-header-actions">
              {isOwnProfile ? (
                <Link to="/settings" className="btn btn-secondary btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setConnectMessage(`Hey ${profile.displayName}, I'd love to connect on DevVerse!`);
                      setShowConnectModal(true);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Connect Squad
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleStartConversation}
                    disabled={messageLoading}
                  >
                    {messageLoading ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Message
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profile-names-block">
            <h1>{profile.displayName}</h1>
            <span className="profile-handle">@{profile.username}</span>
          </div>

          {profile.title && <div className="profile-headline">{profile.title}</div>}

          {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}

          <div className="profile-meta-chips">
            {profile.location && (
              <span className="profile-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {profile.location}
              </span>
            )}

            <span className="profile-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Joined {formatDate(profile.createdAt)}
            </span>
          </div>

          {/* Social Links */}
          <div className="profile-social-links">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="profile-social-btn"
              >
                GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="profile-social-btn"
              >
                LinkedIn
              </a>
            )}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="profile-social-btn"
              >
                Portfolio
              </a>
            )}
            {profile.twitterUrl && (
              <a
                href={profile.twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="profile-social-btn"
              >
                Twitter
              </a>
            )}
          </div>
        </div>
      </div>

      {/* User Statistics Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-box xp-highlight">
          <span className="profile-stat-label">DevVerse Score</span>
          <span className="profile-stat-val">⚡ {profile.score || 0} XP</span>
        </div>

        <div className="profile-stat-box">
          <span className="profile-stat-label">Projects Shipped</span>
          <span className="profile-stat-val">
            {profile.stats?.projects ?? projects.length}
          </span>
        </div>

        <div className="profile-stat-box">
          <span className="profile-stat-label">Communities</span>
          <span className="profile-stat-val">
            {profile.stats?.communities ?? 0}
          </span>
        </div>

        <div className="profile-stat-box">
          <span className="profile-stat-label">Codex Logs</span>
          <span className="profile-stat-val">
            {profile.stats?.codexEntries ?? 0}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs-nav">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects ({projects.length})
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity ({activities.length})
        </button>
      </div>

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="tab-content animate-fade-in">
          {projects.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <h3>No projects published yet</h3>
              <p>This developer hasn't published any public projects yet.</p>
              {isOwnProfile && (
                <Link to="/projects/new" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
                  Ship Your First Project
                </Link>
              )}
            </div>
          ) : (
            <div className="profile-projects-grid">
              {projects.map((proj) => (
                <div key={proj._id} className="profile-project-card">
                  <h3>
                    <Link to={`/projects/${proj.slug || proj._id}`} style={{ color: 'inherit' }}>
                      {proj.title}
                    </Link>
                  </h3>

                  <p>{proj.description}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-4)', marginTop: 'auto' }}>
                    {proj.technologies && proj.technologies.slice(0, 4).map((tech, idx) => (
                      <span key={idx} className="dev-skill-chip">
                        #{tech}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      ♥ {proj.likesCount || 0} upvotes
                    </span>
                    <Link
                      to={`/projects/${proj.slug || proj._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Activity Feed */}
      {activeTab === 'activity' && (
        <div className="tab-content animate-fade-in">
          {activities.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <h3>No recent activity</h3>
              <p>Recent platform events, project releases, and community contributions will show up here.</p>
            </div>
          ) : (
            <div className="profile-activity-timeline">
              {activities.map((act) => (
                <div key={act._id} className="activity-feed-row">
                  <div className="activity-icon-bubble">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <span className="activity-desc-text">
                    {act.description || 'Contributed to DevVerse'}
                  </span>
                  <span className="activity-timestamp-text">
                    {formatTimeAgo(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect with {profile.displayName}</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowConnectModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSendSquadRequest}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Collaboration Focus</label>
                  <input
                    type="text"
                    className="form-input"
                    value={connectGoals}
                    onChange={(e) => setConnectGoals(e.target.value)}
                    placeholder="e.g. Hackathon Team, Open Source Build"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={connectMessage}
                    onChange={(e) => setConnectMessage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowConnectModal(false)}
                  disabled={sendingRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={sendingRequest}
                >
                  {sendingRequest ? <span className="spinner" /> : 'Send Squad Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
