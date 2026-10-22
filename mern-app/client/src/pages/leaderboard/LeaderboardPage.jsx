import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Leaderboard.css';

const SCORING_RULES = [
  {
    title: 'Ship Projects',
    points: '+10 XP',
    desc: 'Deploy full-stack projects to the DevVerse showcase with live demo links and documentation.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    title: 'Publish Codex Entries',
    points: '+5 XP',
    desc: 'Share architectural deep-dives, debugging incidents, and hard-earned engineering lessons.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: 'Found Communities',
    points: '+8 XP',
    desc: 'Create specialized technology circles and lead developer group collaboration.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Hackathon Battles',
    points: '+7 XP',
    desc: 'Join hackathon challenges and build competitive applications in intense sprints.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
      </svg>
    ),
  },
  {
    title: 'Discussion Insights',
    points: '+3 XP',
    desc: 'Start threaded discussions and contribute meaningful solutions to peer questions.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function LeaderboardPage() {
  const toast = useToast();
  const [rankedUsers, setRankedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaderboard');
      if (res.success && Array.isArray(res.data)) {
        setRankedUsers(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load leaderboard rankings');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const top1 = rankedUsers[0];
  const top2 = rankedUsers[1];
  const top3 = rankedUsers[2];

  const filteredUsers = rankedUsers.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="leaderboard-container animate-fade-in">
      {/* Header */}
      <div className="leaderboard-header">
        <h1>
          Global <span className="grad-text">Developer Leaderboard</span>
        </h1>
        <p>
          Ranked by proven contribution: applications shipped, knowledge indexed in Codex, hackathon completions, and community impact.
        </p>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: 'var(--space-4)' }}>Calculating global developer scores...</p>
        </div>
      ) : rankedUsers.length === 0 ? (
        <div className="empty-state">
          <p>No developers ranked yet.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Display */}
          {top1 && (
            <div className="leaderboard-podium">
              {/* 2nd Place */}
              {top2 && (
                <div className="podium-card second">
                  <div className="podium-crown">🥈</div>
                  <div className="podium-avatar-wrapper">
                    {top2.avatar ? (
                      <img src={top2.avatar} alt={top2.displayName} className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar avatar-placeholder">
                        {(top2.displayName?.[0] || '2').toUpperCase()}
                      </div>
                    )}
                    <span className="podium-rank-badge">2</span>
                  </div>

                  <Link to={`/profile/${top2.username}`} className="podium-name">
                    {top2.displayName}
                  </Link>
                  <span className="podium-handle">@{top2.username}</span>

                  <span className="podium-score-pill">⚡ {top2.score || 0} XP</span>

                  <Link to={`/profile/${top2.username}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    View Profile
                  </Link>
                </div>
              )}

              {/* 1st Place */}
              <div className="podium-card first">
                <div className="podium-crown">👑</div>
                <div className="podium-avatar-wrapper">
                  {top1.avatar ? (
                    <img src={top1.avatar} alt={top1.displayName} className="podium-avatar" />
                  ) : (
                    <div className="podium-avatar avatar-placeholder">
                      {(top1.displayName?.[0] || '1').toUpperCase()}
                    </div>
                  )}
                  <span className="podium-rank-badge">1</span>
                </div>

                <Link to={`/profile/${top1.username}`} className="podium-name">
                  {top1.displayName}
                </Link>
                <span className="podium-handle">@{top1.username}</span>

                <span className="podium-score-pill">⚡ {top1.score || 0} XP</span>

                <Link to={`/profile/${top1.username}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  View Champion
                </Link>
              </div>

              {/* 3rd Place */}
              {top3 && (
                <div className="podium-card third">
                  <div className="podium-crown">🥉</div>
                  <div className="podium-avatar-wrapper">
                    {top3.avatar ? (
                      <img src={top3.avatar} alt={top3.displayName} className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar avatar-placeholder">
                        {(top3.displayName?.[0] || '3').toUpperCase()}
                      </div>
                    )}
                    <span className="podium-rank-badge">3</span>
                  </div>

                  <Link to={`/profile/${top3.username}`} className="podium-name">
                    {top3.displayName}
                  </Link>
                  <span className="podium-handle">@{top3.username}</span>

                  <span className="podium-score-pill">⚡ {top3.score || 0} XP</span>

                  <Link to={`/profile/${top3.username}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Search within leaderboard */}
          <div style={{ maxWidth: '500px', margin: '0 auto var(--space-6)', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Filter ranked builders by name, handle, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Ranked Table */}
          <div className="leaderboard-table-card">
            <div className="leaderboard-table-header">
              <span>Rank</span>
              <span>Developer</span>
              <span className="hide-on-mobile">Specialties</span>
              <span>DevVerse XP</span>
              <span style={{ textAlign: 'right' }}>Action</span>
            </div>

            <div className="leaderboard-table-body">
              {filteredUsers.map((dev) => (
                <div key={dev._id} className="leaderboard-row">
                  <span className={`rank-number ${dev.rank <= 3 ? 'top' : ''}`}>
                    #{dev.rank}
                  </span>

                  <div className="leaderboard-dev-meta">
                    {dev.avatar ? (
                      <img src={dev.avatar} alt={dev.displayName} className="avatar avatar-sm" />
                    ) : (
                      <div className="avatar avatar-sm avatar-placeholder">
                        {(dev.displayName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Link to={`/profile/${dev.username}`} className="table-dev-name">
                        {dev.displayName}
                      </Link>
                      <span className="table-dev-handle">@{dev.username}</span>
                    </div>
                  </div>

                  <div className="table-skills-group hide-on-mobile">
                    {dev.skills && dev.skills.length > 0 ? (
                      dev.skills.slice(0, 2).map((sk, idx) => (
                        <span key={idx} className="dev-skill-chip">
                          #{sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-dim text-xs">—</span>
                    )}
                  </div>

                  <div className="table-score-pill">⚡ {dev.score || 0} XP</div>

                  <div style={{ textAlign: 'right' }}>
                    <Link
                      to={`/profile/${dev.username}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Scoring Explanation Section */}
      <div className="scoring-rules-section">
        <h2>How to Earn DevVerse XP</h2>
        <p className="subtitle">
          Points are automatically calculated across all platform activities to quantify genuine engineering contribution.
        </p>

        <div className="scoring-grid">
          {SCORING_RULES.map((rule, idx) => (
            <div key={idx} className="scoring-card">
              <div className="scoring-icon">{rule.icon}</div>
              <div className="scoring-points">{rule.points}</div>
              <div className="scoring-title">{rule.title}</div>
              <div className="scoring-desc">{rule.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
