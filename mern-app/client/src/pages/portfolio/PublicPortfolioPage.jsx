import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './Portfolio.css';

export default function PublicPortfolioPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // '404', 'private', or null

  useEffect(() => {
    async function loadPublicPortfolio() {
      setLoading(true);
      setErrorStatus(null);
      try {
        const res = await api.get(`/portfolios/user/${username}`);
        if (res.success && res.data) {
          setPortfolio(res.data);
        } else {
          setErrorStatus('not_found');
        }
      } catch (err) {
        if (err.status === 404 || err.message?.includes('not found')) {
          setErrorStatus('not_found');
        } else if (err.status === 403 || err.message?.includes('Private')) {
          setErrorStatus('private');
        } else {
          setErrorStatus('error');
          toast.error(err.message || 'Failed to load portfolio');
        }
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadPublicPortfolio();
    }
  }, [username, toast]);

  if (loading) {
    return (
      <div className="public-portfolio-container">
        <div className="card skeleton-card skeleton" style={{ height: '260px', marginBottom: 'var(--space-8)' }} />
        <div className="card skeleton-card skeleton" style={{ height: '180px', marginBottom: 'var(--space-8)' }} />
        <div className="card skeleton-card skeleton" style={{ height: '320px' }} />
      </div>
    );
  }

  // Not found or private portfolio view
  if (errorStatus || !portfolio) {
    return (
      <div className="public-portfolio-container">
        <div className="card empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <h3>Portfolio Unavailable</h3>
          <p>
            {errorStatus === 'private'
              ? `The portfolio for @${username} is currently set to private.`
              : `We couldn't find a portfolio associated with developer @${username}.`}
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
            <Link to="/explore" className="btn btn-secondary">
              Explore DevVerse
            </Link>
            {user && user.username === username && (
              <Link to="/portfolio" className="btn btn-primary">
                Edit & Make Public
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const u = portfolio.user || {};
  const isOwner = Boolean(
    user && (user._id === u._id || user.username?.toLowerCase() === username?.toLowerCase())
  );

  const skills = Array.isArray(portfolio.skills) ? portfolio.skills : [];
  const experience = Array.isArray(portfolio.experience) ? portfolio.experience : [];
  const achievements = Array.isArray(portfolio.achievements) ? portfolio.achievements : [];
  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
  const social = portfolio.socialLinks || {};

  return (
    <div className="public-portfolio-container animate-fade-in">
      {/* Hero Banner */}
      <header className="public-hero-card">
        <div className="public-hero-top">
          <div className="public-hero-user">
            <div className="public-avatar-ring">
              {u.avatar ? (
                <img
                  src={u.avatar}
                  alt={u.displayName || u.username}
                  className="public-avatar-img"
                />
              ) : (
                <div className="public-avatar-fallback">
                  {(u.displayName || u.username || 'D')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="public-user-meta">
              <h1>{u.displayName || u.username}</h1>
              <div className="public-username">@{u.username}</div>
              {u.location && (
                <div className="public-meta-chips" style={{ marginTop: 'var(--space-2)' }}>
                  <span className="public-meta-chip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {u.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isOwner && (
            <Link to="/portfolio" className="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Portfolio
            </Link>
          )}
        </div>

        {/* Headline */}
        {portfolio.headline && (
          <div className="public-headline">
            &ldquo;{portfolio.headline}&rdquo;
          </div>
        )}

        {/* Social Links Ribbon */}
        {(social.github || social.linkedin || social.twitter || social.website) && (
          <nav className="public-social-ribbon" aria-label="Social Profiles">
            {social.github && (
              <a
                href={social.github.startsWith('http') ? social.github : `https://${social.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="public-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}

            {social.linkedin && (
              <a
                href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="public-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                LinkedIn
              </a>
            )}

            {social.twitter && (
              <a
                href={social.twitter.startsWith('http') ? social.twitter : `https://${social.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="public-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter / X
              </a>
            )}

            {social.website && (
              <a
                href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="public-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Website
              </a>
            )}
          </nav>
        )}
      </header>

      {/* About Section */}
      {portfolio.about && (
        <section className="public-section">
          <h2 className="public-section-title">About Me</h2>
          <div className="public-about-card">
            {portfolio.about}
          </div>
        </section>
      )}

      {/* Skills Showcase */}
      {skills.length > 0 && (
        <section className="public-section">
          <h2 className="public-section-title">Technical Skills</h2>
          <div className="public-skills-grid">
            {skills.map((skill, idx) => (
              <div key={idx} className="public-skill-card">
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience Timeline */}
      {experience.length > 0 && (
        <section className="public-section">
          <h2 className="public-section-title">Work Experience</h2>
          <div className="timeline-container">
            {experience.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot" aria-hidden="true" />
                <div className="timeline-card">
                  <div className="timeline-header">
                    <div>
                      <h3 className="timeline-role">{item.role}</h3>
                      <div className="timeline-company">{item.company}</div>
                    </div>
                    <span className="timeline-period">
                      {item.startDate} — {item.endDate || 'Present'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="timeline-description">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements Showcase */}
      {achievements.length > 0 && (
        <section className="public-section">
          <h2 className="public-section-title">Achievements & Milestones</h2>
          <div className="public-achievements-grid">
            {achievements.map((item, idx) => (
              <div key={idx} className="public-achievement-card">
                <div className="achievement-icon-row">
                  <div className="achievement-trophy-badge" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  </div>
                  {item.date && (
                    <span className="achievement-date">{item.date}</span>
                  )}
                </div>
                <h3 className="achievement-title">{item.title}</h3>
                {item.description && (
                  <p className="achievement-desc">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects Grid */}
      {projects.length > 0 && (
        <section className="public-section">
          <h2 className="public-section-title">Featured Projects</h2>
          <div className="public-projects-grid">
            {projects.map((project) => (
              <div key={project._id} className="public-project-card">
                <div>
                  <div className="project-card-header">
                    <h3 className="project-card-title">
                      <Link to={`/projects/${project.slug}`}>
                        {project.title}
                      </Link>
                    </h3>
                  </div>

                  <p className="project-card-desc">
                    {project.tagline || project.description}
                  </p>

                  {project.tags && project.tags.length > 0 && (
                    <div className="project-tech-tags">
                      {project.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="tag tag-accent">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="project-links-bar">
                  <Link to={`/projects/${project.slug}`} className="project-link-btn">
                    View Case Study →
                  </Link>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link-btn"
                    >
                      Live Demo ↗
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link-btn"
                    >
                      Source Code ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="public-portfolio-footer">
        <p>Built with DevVerse • The Developer Ecosystem</p>
      </footer>
    </div>
  );
}
