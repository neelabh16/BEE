import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './DashboardPage.css';

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

// Activity icon & styling helper
function getActivityMeta(type) {
  switch (type) {
    case 'project_created':
      return {
        label: 'Project Shipped',
        colorClass: 'act-project',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        ),
      };
    case 'project_liked':
      return {
        label: 'Liked Project',
        colorClass: 'act-like',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
      };
    case 'community_joined':
      return {
        label: 'Joined Community',
        colorClass: 'act-community',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          </svg>
        ),
      };
    case 'community_created':
      return {
        label: 'Founded Community',
        colorClass: 'act-community',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        ),
      };
    case 'codex_created':
      return {
        label: 'Codex Published',
        colorClass: 'act-codex',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      };
    case 'hackathon_joined':
      return {
        label: 'Hackathon Registered',
        colorClass: 'act-hackathon',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
          </svg>
        ),
      };
    default:
      return {
        label: 'Activity',
        colorClass: 'act-default',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        ),
      };
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  // State: Stats
  const [stats, setStats] = useState({
    projects: 0,
    communities: 0,
    codex: 0,
    hackathons: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // State: Activities
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // State: Projects preview
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  // State: Communities preview
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState(null);

  // Fetch Stats from /api/v1/users/:id/stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await api.get(`/users/${userId}/stats`);
      const data = res.data || {};
      setStats({
        projects: data.projects ?? data.projectsCount ?? 0,
        communities: data.communities ?? data.communitiesCount ?? 0,
        codex: data.codex ?? data.codexEntries ?? data.codexCount ?? 0,
        hackathons: data.hackathons ?? data.hackathonsCount ?? 0,
      });
    } catch (err) {
      setStatsError(err.message || 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, [userId]);

  // Fetch Activities from /api/v1/users/:id/activities
  const fetchActivities = useCallback(async () => {
    if (!userId) return;
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const res = await api.get(`/users/${userId}/activities?limit=8`);
      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Fallback try /activity
      try {
        const fallbackRes = await api.get(`/users/${userId}/activity?limit=8`);
        setActivities(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch (fallbackErr) {
        setActivitiesError(fallbackErr.message || 'Failed to load recent activity');
      }
    } finally {
      setActivitiesLoading(false);
    }
  }, [userId]);

  // Fetch Projects Preview from /api/v1/projects/user/:userId
  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await api.get(`/projects/user/${userId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      setProjects(list.slice(0, 3));
    } catch (err) {
      // Fallback to query param
      try {
        const fallbackRes = await api.get(`/projects?owner=${userId}&limit=3`);
        const list = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        setProjects(list.slice(0, 3));
      } catch (fallbackErr) {
        setProjectsError(fallbackErr.message || 'Failed to load projects');
      }
    } finally {
      setProjectsLoading(false);
    }
  }, [userId]);

  // Fetch Communities Preview from /api/v1/communities/user/:userId
  const fetchCommunities = useCallback(async () => {
    if (!userId) return;
    setCommunitiesLoading(true);
    setCommunitiesError(null);
    try {
      const res = await api.get(`/communities/user/${userId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      setCommunities(list.slice(0, 3));
    } catch (err) {
      // Fallback to query param
      try {
        const fallbackRes = await api.get(`/communities?member=${userId}&limit=3`);
        const list = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        setCommunities(list.slice(0, 3));
      } catch (fallbackErr) {
        setCommunitiesError(fallbackErr.message || 'Failed to load joined communities');
      }
    } finally {
      setCommunitiesLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchStats();
      fetchActivities();
      fetchProjects();
      fetchCommunities();
    }
  }, [userId, fetchStats, fetchActivities, fetchProjects, fetchCommunities]);

  const displayName = user?.displayName || user?.name || user?.username || 'Builder';

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* ================= WELCOME SECTION ================= */}
        <section className="dashboard-welcome-section">
          <div className="welcome-header">
            <div className="welcome-text-group">
              <h1 className="welcome-title">
                Welcome back, <span className="grad-text">{displayName}</span> 👋
              </h1>
              <p className="welcome-subtitle">
                {user?.title
                  ? `${user.title} · Here's your mission control and builder statistics.`
                  : "Here's what is happening across your projects, communities, and squads today."}
              </p>
            </div>

            {user?.score !== undefined && (
              <div className="welcome-score-badge" title="Platform Builder Score">
                <span className="score-icon">⚡</span>
                <span className="score-val">{user.score}</span>
                <span className="score-lbl">XP</span>
              </div>
            )}
          </div>

          {/* Quick Stat Cards */}
          <div className="stats-row">
            {/* Stat 1: My Projects */}
            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <span className="dash-stat-label">My Projects</span>
                <div className="dash-stat-icon-wrap icon-projects">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
              </div>
              <div className="dash-stat-val">
                {statsLoading ? (
                  <div className="dash-skeleton dash-skeleton-num" />
                ) : (
                  stats.projects
                )}
              </div>
              <Link to="/explore" className="dash-stat-link">
                View projects &rarr;
              </Link>
            </div>

            {/* Stat 2: Communities Joined */}
            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <span className="dash-stat-label">Communities Joined</span>
                <div className="dash-stat-icon-wrap icon-communities">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                </div>
              </div>
              <div className="dash-stat-val">
                {statsLoading ? (
                  <div className="dash-skeleton dash-skeleton-num" />
                ) : (
                  stats.communities
                )}
              </div>
              <Link to="/communities" className="dash-stat-link">
                Browse circles &rarr;
              </Link>
            </div>

            {/* Stat 3: Codex Entries */}
            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <span className="dash-stat-label">Codex Entries</span>
                <div className="dash-stat-icon-wrap icon-codex">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>
              <div className="dash-stat-val">
                {statsLoading ? (
                  <div className="dash-skeleton dash-skeleton-num" />
                ) : (
                  stats.codex
                )}
              </div>
              <Link to="/codex" className="dash-stat-link">
                Read codex &rarr;
              </Link>
            </div>

            {/* Stat 4: Hackathons */}
            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <span className="dash-stat-label">Hackathons</span>
                <div className="dash-stat-icon-wrap icon-hackathons">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
                  </svg>
                </div>
              </div>
              <div className="dash-stat-val">
                {statsLoading ? (
                  <div className="dash-skeleton dash-skeleton-num" />
                ) : (
                  stats.hackathons
                )}
              </div>
              <Link to="/hackathons" className="dash-stat-link">
                View challenges &rarr;
              </Link>
            </div>
          </div>

          {statsError && (
            <div className="dash-error-banner">
              <span>Failed to fetch some dashboard stats.</span>
              <button type="button" onClick={fetchStats} className="btn-retry">
                Retry
              </button>
            </div>
          )}
        </section>

        {/* ================= QUICK ACTIONS ================= */}
        <section className="dashboard-actions-section" aria-label="Quick Actions">
          <div className="section-title-wrap">
            <h2 className="dash-section-title">Quick Actions</h2>
            <span className="dash-section-hint">High velocity shortcuts</span>
          </div>

          <div className="quick-actions-grid">
            <Link to="/projects/new" className="action-card action-card-project">
              <div className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="action-info">
                <span className="action-name">New Project</span>
                <span className="action-desc">Ship a project and share with peers</span>
              </div>
            </Link>

            <Link to="/codex/new" className="action-card action-card-codex">
              <div className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div className="action-info">
                <span className="action-name">New Codex Entry</span>
                <span className="action-desc">Log engineering patterns & lessons</span>
              </div>
            </Link>

            <Link to="/hackathons" className="action-card action-card-hackathon">
              <div className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="action-info">
                <span className="action-name">Browse Hackathons</span>
                <span className="action-desc">Join global challenges with bounties</span>
              </div>
            </Link>

            <Link to="/squads" className="action-card action-card-squad">
              <div className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div className="action-info">
                <span className="action-name">Find Squad Members</span>
                <span className="action-desc">Match with developers building next-gen tech</span>
              </div>
            </Link>
          </div>
        </section>

        {/* ================= MAIN CONTENT SPLIT ================= */}
        <div className="dashboard-grid-split">
          {/* Left Column: My Projects & Joined Communities */}
          <div className="dashboard-content-primary">
            {/* My Projects Preview */}
            <section className="dash-card-section" aria-label="My Projects">
              <div className="dash-section-header">
                <div className="dash-header-title-group">
                  <h2 className="dash-section-title">My Projects</h2>
                  <span className="dash-count-pill">{projects.length} preview</span>
                </div>
                <Link to="/explore" className="dash-header-link">
                  View All Projects &rarr;
                </Link>
              </div>

              {projectsLoading ? (
                <div className="preview-cards-list">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="dash-project-card skeleton-card">
                      <div className="dash-skeleton dash-skel-title" />
                      <div className="dash-skeleton dash-skel-text" />
                      <div className="dash-skeleton dash-skel-meta" />
                    </div>
                  ))}
                </div>
              ) : projectsError ? (
                <div className="dash-state-box error-box">
                  <p>{projectsError}</p>
                  <button type="button" onClick={fetchProjects} className="btn btn-secondary btn-sm">
                    Retry
                  </button>
                </div>
              ) : projects.length === 0 ? (
                <div className="dash-empty-state">
                  <div className="empty-state-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <h4 className="empty-title">You haven&apos;t published any projects yet</h4>
                  <p className="empty-desc">
                    Showcase your work to the developer community, get feedback, and build your reputation.
                  </p>
                  <Link to="/projects/new" className="btn btn-primary btn-sm">
                    Create Your First Project
                  </Link>
                </div>
              ) : (
                <div className="preview-cards-list">
                  {projects.map((project) => (
                    <Link
                      key={project._id}
                      to={`/projects/${project.slug || project._id}`}
                      className="dash-project-card"
                    >
                      <div className="project-card-header">
                        <h3 className="project-title">{project.title}</h3>
                        <span className={`cat-badge cat-${project.category || 'other'}`}>
                          {project.category || 'web'}
                        </span>
                      </div>

                      <p className="project-snippet">
                        {project.description || 'No description provided.'}
                      </p>

                      <div className="project-card-footer">
                        <div className="project-tech-pills">
                          {Array.isArray(project.technologies) &&
                            project.technologies.slice(0, 3).map((tech, idx) => (
                              <span key={idx} className="tech-pill">
                                {tech}
                              </span>
                            ))}
                        </div>

                        <div className="project-likes" title={`${project.likesCount || 0} likes`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{project.likesCount || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Joined Communities Preview */}
            <section className="dash-card-section" aria-label="Joined Communities">
              <div className="dash-section-header">
                <div className="dash-header-title-group">
                  <h2 className="dash-section-title">Joined Communities</h2>
                  <span className="dash-count-pill">{communities.length} preview</span>
                </div>
                <Link to="/communities" className="dash-header-link">
                  Explore Communities &rarr;
                </Link>
              </div>

              {communitiesLoading ? (
                <div className="preview-communities-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="dash-community-card skeleton-card">
                      <div className="dash-skeleton dash-skel-comm-top" />
                      <div className="dash-skeleton dash-skel-meta" />
                    </div>
                  ))}
                </div>
              ) : communitiesError ? (
                <div className="dash-state-box error-box">
                  <p>{communitiesError}</p>
                  <button type="button" onClick={fetchCommunities} className="btn btn-secondary btn-sm">
                    Retry
                  </button>
                </div>
              ) : communities.length === 0 ? (
                <div className="dash-empty-state">
                  <div className="empty-state-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    </svg>
                  </div>
                  <h4 className="empty-title">You haven&apos;t joined any communities yet</h4>
                  <p className="empty-desc">
                    Connect with fellow builders in niche technical channels and exchange knowledge.
                  </p>
                  <Link to="/communities" className="btn btn-secondary btn-sm">
                    Browse Communities
                  </Link>
                </div>
              ) : (
                <div className="preview-communities-grid">
                  {communities.map((comm) => (
                    <Link
                      key={comm._id}
                      to={`/communities/${comm.slug || comm._id}`}
                      className="dash-community-card"
                    >
                      <div className="comm-card-main">
                        <div className="comm-avatar">
                          {comm.avatar ? (
                            <img src={comm.avatar} alt={comm.name} />
                          ) : (
                            <span>{comm.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="comm-details">
                          <h4 className="comm-name">{comm.name}</h4>
                          <span className="comm-topic-badge">{comm.topic || 'General'}</span>
                        </div>
                      </div>

                      <div className="comm-card-footer">
                        <div className="comm-members">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          <span>{comm.membersCount ?? comm.members?.length ?? 1} members</span>
                        </div>
                        <span className="comm-arrow">&rarr;</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Recent Activity Feed */}
          <aside className="dashboard-content-secondary" aria-label="Recent Activity">
            <section className="dash-card-section activity-panel">
              <div className="dash-section-header">
                <div className="dash-header-title-group">
                  <h2 className="dash-section-title">Recent Activity</h2>
                </div>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={fetchActivities}
                  title="Refresh activity"
                  aria-label="Refresh activity"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>

              {activitiesLoading ? (
                <div className="activity-skeleton-list">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="activity-skeleton-item">
                      <div className="dash-skeleton skel-circle" />
                      <div className="skel-activity-content">
                        <div className="dash-skeleton skel-line-short" />
                        <div className="dash-skeleton skel-line-long" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesError ? (
                <div className="dash-state-box error-box">
                  <p>{activitiesError}</p>
                  <button type="button" onClick={fetchActivities} className="btn btn-secondary btn-sm">
                    Retry
                  </button>
                </div>
              ) : activities.length === 0 ? (
                <div className="dash-empty-state empty-activity">
                  <div className="empty-state-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                  </div>
                  <h4 className="empty-title">No recent activity</h4>
                  <p className="empty-desc">
                    Your actions across DevVerse (shipments, likes, discussions, hackathons) will show here.
                  </p>
                </div>
              ) : (
                <div className="activity-timeline">
                  {activities.map((act) => {
                    const meta = getActivityMeta(act.type);
                    return (
                      <div key={act._id} className="timeline-item">
                        <div className={`timeline-icon-box ${meta.colorClass}`}>
                          {meta.icon}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-badge">{meta.label}</span>
                            <span className="timeline-time">
                              {formatTimeAgo(act.createdAt)}
                            </span>
                          </div>
                          <p className="timeline-description">
                            {act.description || 'Activity recorded'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
