import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Projects.css';

const CATEGORIES = [
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Apps' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'blockchain', label: 'Blockchain & Web3' },
  { value: 'gamedev', label: 'Game Development' },
  { value: 'iot', label: 'Internet of Things' },
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
    description: '',
    technologies: '',
    githubUrl: '',
    liveUrl: '',
    coverImage: '',
    status: 'published',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be 100 characters or fewer';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Description must be 5000 characters or fewer';
    }

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

    if (formData.githubUrl.trim() && !urlPattern.test(formData.githubUrl.trim())) {
      newErrors.githubUrl = 'Please provide a valid URL for GitHub';
    }

    if (formData.liveUrl.trim() && !urlPattern.test(formData.liveUrl.trim())) {
      newErrors.liveUrl = 'Please provide a valid live demo URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      // Parse technologies into an array
      const techList = formData.technologies
        ? formData.technologies
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        technologies: techList,
        githubUrl: formData.githubUrl.trim(),
        liveUrl: formData.liveUrl.trim(),
        coverImage: formData.coverImage.trim(),
        status: formData.status,
      };

      const res = await api.post('/projects', payload);
      toast.success('Project submitted successfully! 🎉');
      navigate(`/projects/${res.data.slug || res.data._id}`);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to submit project';
      toast.error(msg);
      if (err.data?.errors) {
        setErrors(err.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="project-form-page">
      <div className="project-form-container">
        {/* Navigation Breadcrumb */}
        <div className="project-breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <Link to="/explore">Explore</Link>
          <span>/</span>
          <span className="text-dim">New Project</span>
        </div>

        <div className="project-form-card">
          <header className="project-form-header">
            <h1 className="project-form-title">Showcase Your Project</h1>
            <p className="project-form-subtitle">
              Share what you have built with the DevVerse community. Receive feedback, discover contributors, and earn builder XP.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="project-form" noValidate>
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Project Title <span className="text-accent">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Omnisearch AI or CloudMesh Dashboard"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {errors.title ? (
                  <span className="form-error">{errors.title}</span>
                ) : (
                  <span className="form-hint">A concise, memorable title for your project</span>
                )}
                <span className="form-hint">{formData.title.length}/100</span>
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Primary Category <span className="text-accent">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`form-select ${errors.category ? 'error' : ''}`}
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Project Overview & Details <span className="text-accent">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                rows={6}
                placeholder="What problem does it solve? What architecture or stack did you choose? Highlight key features and achievements."
                value={formData.description}
                onChange={handleChange}
                maxLength={5000}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {errors.description ? (
                  <span className="form-error">{errors.description}</span>
                ) : (
                  <span className="form-hint">Markdown formatting and line breaks are preserved</span>
                )}
                <span className="form-hint">{formData.description.length}/5000</span>
              </div>
            </div>

            {/* Technologies */}
            <div className="form-group">
              <label htmlFor="technologies" className="form-label">
                Technologies & Tools
              </label>
              <input
                id="technologies"
                name="technologies"
                type="text"
                className="form-input"
                placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, Tailwind"
                value={formData.technologies}
                onChange={handleChange}
              />
              <span className="form-hint">Separate stack items with commas</span>
            </div>

            {/* GitHub & Live Demo URLs */}
            <div className="project-form-row">
              <div className="form-group">
                <label htmlFor="githubUrl" className="form-label">
                  GitHub Repository URL
                </label>
                <input
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  className={`form-input ${errors.githubUrl ? 'error' : ''}`}
                  placeholder="https://github.com/username/repo"
                  value={formData.githubUrl}
                  onChange={handleChange}
                />
                {errors.githubUrl && <span className="form-error">{errors.githubUrl}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="liveUrl" className="form-label">
                  Live Demo URL
                </label>
                <input
                  id="liveUrl"
                  name="liveUrl"
                  type="url"
                  className={`form-input ${errors.liveUrl ? 'error' : ''}`}
                  placeholder="https://your-demo-url.com"
                  value={formData.liveUrl}
                  onChange={handleChange}
                />
                {errors.liveUrl && <span className="form-error">{errors.liveUrl}</span>}
              </div>
            </div>

            {/* Cover Image URL */}
            <div className="form-group">
              <label htmlFor="coverImage" className="form-label">
                Cover Image URL (Optional)
              </label>
              <input
                id="coverImage"
                name="coverImage"
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={formData.coverImage}
                onChange={handleChange}
              />
              <span className="form-hint">Direct link to an image (PNG, JPG, WebP)</span>

              {formData.coverImage.trim() && (
                <div className="project-cover-preview">
                  <img
                    src={formData.coverImage.trim()}
                    alt="Cover preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Form Footer Buttons */}
            <div className="project-form-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/explore')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Publish Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
