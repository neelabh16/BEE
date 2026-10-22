import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Communities.css';

const TOPICS = [
  { value: 'frontend', label: 'Frontend Development' },
  { value: 'backend', label: 'Backend & Systems' },
  { value: 'fullstack', label: 'Fullstack Engineering' },
  { value: 'mobile', label: 'Mobile Apps' },
  { value: 'devops', label: 'DevOps, CI/CD & Cloud' },
  { value: 'ai-ml', label: 'AI, LLMs & Machine Learning' },
  { value: 'blockchain', label: 'Blockchain & Smart Contracts' },
  { value: 'cybersecurity', label: 'Cybersecurity & Infosec' },
  { value: 'design', label: 'UI/UX & Product Design' },
  { value: 'career', label: 'Career & Engineering Leadership' },
  { value: 'general', label: 'General Tech Discussions' },
];

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    topic: 'frontend',
    description: '',
    avatar: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 80) {
      newErrors.name = 'Name must be 80 characters or fewer';
    }

    if (!formData.topic) {
      newErrors.topic = 'Please select a topic';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be 2000 characters or fewer';
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
      const payload = {
        name: formData.name.trim(),
        topic: formData.topic,
        description: formData.description.trim(),
        avatar: formData.avatar.trim(),
      };

      const res = await api.post('/communities', payload);
      toast.success(`Community "${res.data.name}" created! 🚀`);
      navigate(`/communities/${res.data.slug || res.data._id}`);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to create community';
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
          <Link to="/communities">Communities</Link>
          <span>/</span>
          <span className="text-dim">New Community</span>
        </div>

        <div className="project-form-card">
          <header className="project-form-header">
            <h1 className="project-form-title">Establish a New Community</h1>
            <p className="project-form-subtitle">
              Bring together developers around a language, architectural style, or emerging technology.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="project-form" noValidate>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Community Name <span className="text-accent">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. Next.js Architects, Rustaceans Guild, AI Hackers"
                value={formData.name}
                onChange={handleChange}
                maxLength={80}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {errors.name ? (
                  <span className="form-error">{errors.name}</span>
                ) : (
                  <span className="form-hint">Choose a recognizable, descriptive name</span>
                )}
                <span className="form-hint">{formData.name.length}/80</span>
              </div>
            </div>

            {/* Topic */}
            <div className="form-group">
              <label htmlFor="topic" className="form-label">
                Community Topic & Domain <span className="text-accent">*</span>
              </label>
              <select
                id="topic"
                name="topic"
                className={`form-select ${errors.topic ? 'error' : ''}`}
                value={formData.topic}
                onChange={handleChange}
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.topic && <span className="form-error">{errors.topic}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description & Mission <span className="text-accent">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                rows={5}
                placeholder="Describe the goals, code standards, or discussions members can expect..."
                value={formData.description}
                onChange={handleChange}
                maxLength={2000}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {errors.description ? (
                  <span className="form-error">{errors.description}</span>
                ) : (
                  <span className="form-hint">Explain the purpose and community guidelines</span>
                )}
                <span className="form-hint">{formData.description.length}/2000</span>
              </div>
            </div>

            {/* Avatar URL */}
            <div className="form-group">
              <label htmlFor="avatar" className="form-label">
                Avatar or Icon URL (Optional)
              </label>
              <input
                id="avatar"
                name="avatar"
                type="url"
                className="form-input"
                placeholder="https://..."
                value={formData.avatar}
                onChange={handleChange}
              />
              <span className="form-hint">Image link for the community emblem</span>

              {formData.avatar.trim() && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="community-card-avatar" style={{ width: 56, height: 56 }}>
                    <img
                      src={formData.avatar.trim()}
                      alt="Avatar preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted">Avatar preview</span>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="project-form-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/communities')}
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
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Create Community</span>
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
