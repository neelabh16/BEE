import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './Portfolio.css';

const POPULAR_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB',
  'PostgreSQL', 'Python', 'Docker', 'AWS', 'Next.js', 'TailwindCSS',
  'GraphQL', 'Redis', 'Git', 'CI/CD'
];

export default function PortfolioPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core portfolio state
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
  });
  const [isPublic, setIsPublic] = useState(true);

  // Experience sub-form state (add / edit)
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState(null);
  const [expForm, setExpForm] = useState({
    role: '',
    company: '',
    startDate: '',
    endDate: 'Present',
    description: '',
  });

  // Achievement sub-form state (add / edit)
  const [isAddingAch, setIsAddingAch] = useState(false);
  const [editingAchIndex, setEditingAchIndex] = useState(null);
  const [achForm, setAchForm] = useState({
    title: '',
    date: '',
    description: '',
  });

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/portfolios/me');
      if (res.success && res.data) {
        const p = res.data;
        setHeadline(p.headline || '');
        setAbout(p.about || '');
        setSkills(Array.isArray(p.skills) ? p.skills : []);
        setExperience(Array.isArray(p.experience) ? p.experience : []);
        setAchievements(Array.isArray(p.achievements) ? p.achievements : []);
        setSocialLinks({
          github: p.socialLinks?.github || '',
          linkedin: p.socialLinks?.linkedin || '',
          twitter: p.socialLinks?.twitter || '',
          website: p.socialLinks?.website || '',
        });
        setIsPublic(p.isPublic !== undefined ? p.isPublic : true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Skill Handlers
  const handleAddSkill = (skillName) => {
    const trimmed = (skillName || skillInput).trim();
    if (!trimmed) return;
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning(`"${trimmed}" is already in your skills`);
      return;
    }
    setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // Experience Form Handlers
  const openAddExp = () => {
    setEditingExpIndex(null);
    setExpForm({ role: '', company: '', startDate: '', endDate: 'Present', description: '' });
    setIsAddingExp(true);
  };

  const openEditExp = (index) => {
    setEditingExpIndex(index);
    setExpForm({ ...experience[index] });
    setIsAddingExp(true);
  };

  const saveExpItem = () => {
    if (!expForm.role.trim() || !expForm.company.trim() || !expForm.startDate.trim()) {
      toast.error('Role, Company, and Start Date are required');
      return;
    }

    if (editingExpIndex !== null) {
      setExperience(prev => {
        const next = [...prev];
        next[editingExpIndex] = { ...expForm };
        return next;
      });
    } else {
      setExperience(prev => [...prev, { ...expForm }]);
    }

    setIsAddingExp(false);
    setEditingExpIndex(null);
  };

  const removeExpItem = (index) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };

  // Achievement Form Handlers
  const openAddAch = () => {
    setEditingAchIndex(null);
    setAchForm({ title: '', date: '', description: '' });
    setIsAddingAch(true);
  };

  const openEditAch = (index) => {
    setEditingAchIndex(index);
    setAchForm({ ...achievements[index] });
    setIsAddingAch(true);
  };

  const saveAchItem = () => {
    if (!achForm.title.trim()) {
      toast.error('Achievement title is required');
      return;
    }

    if (editingAchIndex !== null) {
      setAchievements(prev => {
        const next = [...prev];
        next[editingAchIndex] = { ...achForm };
        return next;
      });
    } else {
      setAchievements(prev => [...prev, { ...achForm }]);
    }

    setIsAddingAch(false);
    setEditingAchIndex(null);
  };

  const removeAchItem = (index) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
  };

  // Save all to server
  const handleSavePortfolio = async () => {
    setSaving(true);
    try {
      const payload = {
        headline: headline.trim(),
        about: about.trim(),
        skills,
        experience,
        achievements,
        socialLinks,
        isPublic,
      };

      const res = await api.put('/portfolios/me', payload);
      if (res.success) {
        toast.success('Portfolio updated successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="portfolio-builder-container">
        <div className="skeleton skeleton-card" style={{ height: '80px', marginBottom: 'var(--space-6)' }} />
        <div className="skeleton skeleton-card" style={{ height: '300px' }} />
      </div>
    );
  }

  const username = user?.username || 'me';

  return (
    <div className="portfolio-builder-container animate-fade-in">
      {/* Builder Top Bar */}
      <header className="portfolio-builder-header">
        <div className="portfolio-header-left">
          <h1>Portfolio Builder</h1>
          <p>Design your developer identity, highlight career milestones, and share your work with the world.</p>
        </div>

        <div className="portfolio-header-actions">
          {/* Public / Private Toggle */}
          <div className="visibility-toggle-wrapper">
            <label className="toggle-switch" htmlFor="public-visibility-toggle">
              <input
                id="public-visibility-toggle"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
            <span className={`visibility-label ${isPublic ? 'public' : 'private'}`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>

          {/* View Public Portfolio link */}
          <Link
            to={`/portfolio/${username}`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Public Page
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSavePortfolio}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </header>

      {/* Sections List */}
      <div className="portfolio-sections-list">
        {/* Section 1: Headline & About Me */}
        <section className="portfolio-section-card">
          <div className="portfolio-section-header">
            <div className="section-title-group">
              <div className="section-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2>Headline & About Me</h2>
                <p>A concise summary of who you are and what you build</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <div className="field-label">
                <label htmlFor="portfolio-headline">Professional Headline</label>
                <span className="char-counter">{headline.length}/150</span>
              </div>
              <input
                id="portfolio-headline"
                type="text"
                className="codex-search-input"
                style={{ paddingLeft: 'var(--space-4)' }}
                placeholder="e.g. Full-Stack Engineer passionate about distributed systems & developer tooling"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={150}
              />
            </div>

            <div>
              <div className="field-label">
                <label htmlFor="portfolio-about">About Me (Bio)</label>
                <span className="char-counter">{about.length}/3000</span>
              </div>
              <textarea
                id="portfolio-about"
                className="editor-textarea"
                style={{ minHeight: '160px' }}
                placeholder="Share your journey, core technical interests, side projects, and what kind of problems you love solving..."
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={3000}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Skills */}
        <section className="portfolio-section-card">
          <div className="portfolio-section-header">
            <div className="section-title-group">
              <div className="section-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <h2>Skills & Tech Stack</h2>
                <p>Technologies, libraries, and languages in your core toolbox</p>
              </div>
            </div>
          </div>

          <div className="skills-manager">
            {/* Input Row */}
            <div className="skills-input-row">
              <input
                type="text"
                className="codex-search-input"
                style={{ paddingLeft: 'var(--space-4)' }}
                placeholder="Type a skill and press Enter or Add (e.g. React, Kubernetes)..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddSkill()}
              >
                Add
              </button>
            </div>

            {/* Current Skills Chips */}
            <div className="skills-tag-list">
              {skills.length === 0 ? (
                <span className="text-dim text-xs">No skills added yet. Type above to add your top languages & tools.</span>
              ) : (
                skills.map((skill, idx) => (
                  <span key={idx} className="skill-pill">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      title={`Remove ${skill}`}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Suggested Popular Skills */}
            <div className="suggested-skills">
              <span className="suggested-skills-label">Suggested:</span>
              {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggested-chip"
                  onClick={() => handleAddSkill(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Work Experience */}
        <section className="portfolio-section-card">
          <div className="portfolio-section-header">
            <div className="section-title-group">
              <div className="section-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h2>Work Experience</h2>
                <p>Engineering roles, internships, and contract milestones</p>
              </div>
            </div>

            {!isAddingExp && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={openAddExp}
              >
                + Add Experience
              </button>
            )}
          </div>

          {/* List of existing experience */}
          <div className="items-list">
            {experience.length === 0 && !isAddingExp && (
              <p className="text-dim text-sm" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                No experience entries added. Click &quot;+ Add Experience&quot; to showcase your career timeline.
              </p>
            )}

            {experience.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-card-top">
                  <div>
                    <h3 className="item-card-title">{item.role}</h3>
                    <div className="item-card-subtitle">{item.company}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="item-card-dates">
                      {item.startDate} — {item.endDate || 'Present'}
                    </span>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="item-action-btn"
                        onClick={() => openEditExp(index)}
                        title="Edit entry"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="item-action-btn delete"
                        onClick={() => removeExpItem(index)}
                        title="Delete entry"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {item.description && (
                  <p className="item-card-desc">{item.description}</p>
                )}
              </div>
            ))}

            {/* Experience Add / Edit Sub-form */}
            {isAddingExp && (
              <div className="inline-form-card">
                <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }}>
                  {editingExpIndex !== null ? 'Edit Experience' : 'Add Experience'}
                </h4>

                <div className="form-row">
                  <div>
                    <label className="field-label" htmlFor="exp-role">Role / Title *</label>
                    <input
                      id="exp-role"
                      type="text"
                      className="codex-search-input"
                      style={{ paddingLeft: 'var(--space-4)' }}
                      placeholder="e.g. Senior Frontend Engineer"
                      value={expForm.role}
                      onChange={(e) => setExpForm(prev => ({ ...prev, role: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label" htmlFor="exp-company">Company / Org *</label>
                    <input
                      id="exp-company"
                      type="text"
                      className="codex-search-input"
                      style={{ paddingLeft: 'var(--space-4)' }}
                      placeholder="e.g. Stripe, Vercel"
                      value={expForm.company}
                      onChange={(e) => setExpForm(prev => ({ ...prev, company: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label className="field-label" htmlFor="exp-start">Start Date *</label>
                    <input
                      id="exp-start"
                      type="text"
                      className="codex-search-input"
                      style={{ paddingLeft: 'var(--space-4)' }}
                      placeholder="e.g. Jan 2022"
                      value={expForm.startDate}
                      onChange={(e) => setExpForm(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label" htmlFor="exp-end">End Date</label>
                    <input
                      id="exp-end"
                      type="text"
                      className="codex-search-input"
                      style={{ paddingLeft: 'var(--space-4)' }}
                      placeholder="e.g. Present, or Dec 2023"
                      value={expForm.endDate}
                      onChange={(e) => setExpForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="exp-desc">Key Contributions & Highlights</label>
                  <textarea
                    id="exp-desc"
                    className="editor-textarea"
                    style={{ minHeight: '90px' }}
                    placeholder="Built real-time collaboration engine using WebSockets, optimized TTFB by 40%..."
                    value={expForm.description}
                    onChange={(e) => setExpForm(prev => ({ ...prev, description: e.target.value }))}
                    maxLength={1000}
                  />
                </div>

                <div className="inline-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsAddingExp(false);
                      setEditingExpIndex(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={saveExpItem}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Achievements & Awards */}
        <section className="portfolio-section-card">
          <div className="portfolio-section-header">
            <div className="section-title-group">
              <div className="section-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <div>
                <h2>Achievements & Awards</h2>
                <p>Hackathon wins, open-source milestones, certifications</p>
              </div>
            </div>

            {!isAddingAch && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={openAddAch}
              >
                + Add Achievement
              </button>
            )}
          </div>

          <div className="items-list">
            {achievements.length === 0 && !isAddingAch && (
              <p className="text-dim text-sm" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                No achievements recorded yet. Showcase your hackathon prizes or milestone awards!
              </p>
            )}

            {achievements.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-card-top">
                  <div>
                    <h3 className="item-card-title">{item.title}</h3>
                    {item.date && (
                      <span className="item-card-dates">{item.date}</span>
                    )}
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="item-action-btn"
                      onClick={() => openEditAch(index)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="item-action-btn delete"
                      onClick={() => removeAchItem(index)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="item-card-desc">{item.description}</p>
                )}
              </div>
            ))}

            {/* Achievement Sub-form */}
            {isAddingAch && (
              <div className="inline-form-card">
                <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }}>
                  {editingAchIndex !== null ? 'Edit Achievement' : 'Add Achievement'}
                </h4>

                <div className="form-row">
                  <div>
                    <label className="field-label" htmlFor="ach-title">Title / Award *</label>
                    <input
                      id="ach-title"
                      type="text"
                      className="codex-search-input"
                      style={{ paddingLeft: 'var(--space-4)' }}
                      placeholder="e.g. 1st Place - Global AI Hackathon 2024"
                      value={achForm.title}
                      onChange={(e) => setAchForm(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={150}
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label" htmlFor="ach-date">Date / Year</label>
                    <input
                      id="ach-date"
                      type="text"
                      className="codex-search-input"
                      style={{ paddingLeft: 'var(--space-4)' }}
                      placeholder="e.g. Nov 2024"
                      value={achForm.date}
                      onChange={(e) => setAchForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="ach-desc">Description</label>
                  <textarea
                    id="ach-desc"
                    className="editor-textarea"
                    style={{ minHeight: '80px' }}
                    placeholder="Built an autonomous code review agent in 48 hours..."
                    value={achForm.description}
                    onChange={(e) => setAchForm(prev => ({ ...prev, description: e.target.value }))}
                    maxLength={500}
                  />
                </div>

                <div className="inline-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsAddingAch(false);
                      setEditingAchIndex(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={saveAchItem}
                  >
                    Save Achievement
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Social Links */}
        <section className="portfolio-section-card">
          <div className="portfolio-section-header">
            <div className="section-title-group">
              <div className="section-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h2>Social & Web Links</h2>
                <p>Connect your GitHub profile, LinkedIn, Twitter/X, and portfolio website</p>
              </div>
            </div>
          </div>

          <div className="social-inputs-grid">
            {/* GitHub */}
            <div className="social-input-group">
              <label className="field-label" htmlFor="social-github">GitHub URL</label>
              <div className="social-input-prefix-box">
                <span className="social-icon-wrapper" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </span>
                <input
                  id="social-github"
                  type="url"
                  className="codex-search-input"
                  placeholder="https://github.com/username"
                  value={socialLinks.github}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="social-input-group">
              <label className="field-label" htmlFor="social-linkedin">LinkedIn URL</label>
              <div className="social-input-prefix-box">
                <span className="social-icon-wrapper" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </span>
                <input
                  id="social-linkedin"
                  type="url"
                  className="codex-search-input"
                  placeholder="https://linkedin.com/in/username"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                />
              </div>
            </div>

            {/* Twitter / X */}
            <div className="social-input-group">
              <label className="field-label" htmlFor="social-twitter">Twitter / X URL</label>
              <div className="social-input-prefix-box">
                <span className="social-icon-wrapper" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </span>
                <input
                  id="social-twitter"
                  type="url"
                  className="codex-search-input"
                  placeholder="https://x.com/username"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                />
              </div>
            </div>

            {/* Personal Website */}
            <div className="social-input-group">
              <label className="field-label" htmlFor="social-website">Personal Website / Blog</label>
              <div className="social-input-prefix-box">
                <span className="social-icon-wrapper" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
                <input
                  id="social-website"
                  type="url"
                  className="codex-search-input"
                  placeholder="https://yourdomain.dev"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Save Bar */}
      <footer className="portfolio-save-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="text-sm text-dim">
            Visibility: <strong className={isPublic ? 'text-accent' : 'text-dim'}>{isPublic ? 'Public' : 'Private'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            to={`/portfolio/${username}`}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview Live
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSavePortfolio}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                Saving Changes...
              </>
            ) : (
              'Save All Changes'
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
