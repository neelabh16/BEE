import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Apps' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'blockchain', label: 'Blockchain & Web3' },
  { value: 'gamedev', label: 'Game Development' },
  { value: 'cloud', label: 'Cloud & DevOps' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'data', label: 'Data Science' },
  { value: 'other', label: 'Other' },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    category: 'web',
    difficulty: 'Intermediate',
    description: '',
    technologies: '',
    githubUrl: '',
    liveUrl: '',
    coverImage: '/assets/img/project-cards/project-1.png',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // GitHub Auto-fill
  const [ghUrlInput, setGhUrlInput] = useState('');
  const [ghStatus, setGhStatus] = useState('');
  const [fetchingGh, setFetchingGh] = useState(false);

  const handleFetchGithub = async () => {
    if (!ghUrlInput.trim()) {
      setGhStatus('Please enter a GitHub repository URL.');
      return;
    }
    // Match github.com/owner/repo
    const match = ghUrlInput.trim().match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      setGhStatus('Please enter a valid format: https://github.com/owner/repo');
      return;
    }
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    setFetchingGh(true);
    setGhStatus(`Connecting to GitHub API for ${owner}/${cleanRepo}...`);

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
      if (!res.ok) throw new Error('Repository not found or rate-limited');
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        title: data.name ? data.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : prev.title,
        description: data.description || prev.description,
        technologies: data.language ? `${data.language}, ${prev.technologies}`.replace(/,\s*$/, '') : prev.technologies,
        githubUrl: data.html_url || ghUrlInput.trim(),
        liveUrl: data.homepage || prev.liveUrl,
      }));

      setGhStatus(`Successfully pulled: "${data.full_name}" (★ ${data.stargazers_count?.toLocaleString()} stars).`);
      toast.success('Project details imported from GitHub!');
    } catch (err) {
      setGhStatus(`Could not pull GitHub repo: ${err.message}. You can fill details manually.`);
    } finally {
      setFetchingGh(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Project title is required';
    else if (formData.title.trim().length > 100) errs.title = 'Title must be 100 characters or fewer';

    if (!formData.description.trim()) errs.description = 'Project description is required';
    else if (formData.description.trim().length < 15) errs.description = 'Give it at least 15 characters';

    if (!formData.technologies.trim()) errs.technologies = 'List at least one technology';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors');
      return;
    }

    setSubmitting(true);
    try {
      const techList = formData.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        technologies: techList,
        githubUrl: formData.githubUrl.trim(),
        liveUrl: formData.liveUrl.trim(),
        coverImage: formData.coverImage,
        status: 'published',
      };

      const res = await api.post('/projects', payload);
      toast.success('Project published to Explore! (+25 XP)');
      const slug = res.data?.data?.slug || res.data?.slug;
      if (slug) {
        navigate(`/projects/${slug}`);
      } else {
        navigate('/explore');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to publish project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-project-page">
      {/* Header */}
      <section className="wrap page-header">
        <div className="page-header-flex">
          <div className="page-header-text">
            <div className="eyebrow">Show your work</div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)' }}>Submit a Project</h1>
            <p className="lede">
              Publish something you've built to Explore — pull the basics straight from a public GitHub repo,
              or just fill it in by hand.
            </p>
          </div>
        </div>
      </section>

      {/* Main Studio Content */}
      <section className="wrap section-tight" style={{ paddingTop: 0 }}>
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Left Form Studio */}
          <div>
            {/* GitHub Import Card */}
            <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '6px' }}>Start from a GitHub repo (optional)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Paste a public repo URL and we'll pull its name, description, and primary language from GitHub's real API to save you typing — you can still edit everything before publishing.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={ghUrlInput}
                  onChange={(e) => setGhUrlInput(e.target.value)}
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleFetchGithub}
                  disabled={fetchingGh}
                >
                  {fetchingGh ? 'Fetching...' : 'Fetch from GitHub'}
                </button>
              </div>
              {ghStatus && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '10px', color: 'var(--cyan)' }}>
                  {ghStatus}
                </p>
              )}
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px' }} noValidate>
              <h3 style={{ marginBottom: '20px' }}>Project details</h3>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Voxel Garden"
                  value={formData.title}
                  onChange={handleChange}
                  style={{ width: '100%', borderColor: errors.title ? 'var(--coral)' : undefined }}
                />
                {errors.title && <span style={{ color: 'var(--coral)', fontSize: '12px' }}>{errors.title}</span>}
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="What does it do, why did you build it, and what did you learn?"
                  value={formData.description}
                  onChange={handleChange}
                  style={{ width: '100%', borderColor: errors.description ? 'var(--coral)' : undefined }}
                />
                {errors.description && <span style={{ color: 'var(--coral)', fontSize: '12px' }}>{errors.description}</span>}
              </div>

              <div className="grid grid-2" style={{ gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%' }}>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Difficulty Level
                  </label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange} style={{ width: '100%' }}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tech Stack (comma-separated) *
                </label>
                <input
                  type="text"
                  name="technologies"
                  placeholder="React, Node.js, WebGL, Rust"
                  value={formData.technologies}
                  onChange={handleChange}
                  style={{ width: '100%', borderColor: errors.technologies ? 'var(--coral)' : undefined }}
                />
                {errors.technologies && <span style={{ color: 'var(--coral)', fontSize: '12px' }}>{errors.technologies}</span>}
              </div>

              <div className="grid grid-2" style={{ gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    GitHub Repo URL
                  </label>
                  <input
                    type="url"
                    name="githubUrl"
                    placeholder="https://github.com/..."
                    value={formData.githubUrl}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    name="liveUrl"
                    placeholder="https://myproject.dev"
                    value={formData.liveUrl}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Choose Card Artwork
                </label>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const imgPath = `/assets/img/project-cards/project-${num}.png`;
                    const isSelected = formData.coverImage === imgPath;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, coverImage: imgPath }))}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '6px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'transform 0.2s, border-color 0.2s',
                        }}
                      >
                        <img src={imgPath} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '14px', fontSize: '16px' }}
              >
                {submitting ? 'Publishing to Database...' : 'Publish to Explore (+25 XP)'}
              </button>
            </form>
          </div>

          {/* Right Live Preview Studio Card */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div className="eyebrow" style={{ marginBottom: '12px' }}>Live Card Preview</div>
            <div className="project-card glass card-lift" style={{ maxWidth: '380px' }}>
              <div className="pc-thumb" style={{ background: 'linear-gradient(135deg,#7c6fff,#4fe3c1)' }}>
                <img className="pc-art" src={formData.coverImage} alt="" aria-hidden="true" />
                <span className="chip pc-diff">{formData.difficulty}</span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div className="pc-title">{formData.title || 'Untitled Project'}</div>
                <div className="pc-desc" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {formData.description || 'Provide a description to see how your project preview renders in the DevVerse catalog.'}
                </div>
              </div>
              <div className="pc-tags" style={{ marginTop: '12px' }}>
                {formData.technologies
                  ? formData.technologies.split(',').slice(0, 3).map((t, i) => (
                      <span key={i} className="chip">{t.trim() || 'Tech'}</span>
                    ))
                  : <span className="chip">Technology</span>}
              </div>
              <div className="pc-stats" style={{ marginTop: '14px' }}>
                <span className="pc-stat" style={{ color: 'var(--coral)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>0</span>
                </span>
                <span className="pc-stat">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>1</span>
                </span>
                <span className="mono chip-accent chip" style={{ marginLeft: 'auto', fontSize: '11px' }}>
                  Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
