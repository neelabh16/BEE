import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './Hackathons.css';

const CATEGORIES = [
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Apps' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'blockchain', label: 'Blockchain & Web3' },
  { value: 'iot', label: 'IoT & Embedded' },
  { value: 'open', label: 'Open Track' },
  { value: 'social-good', label: 'Social Good' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
];

const DIFFICULTIES = [
  { value: 'all-levels', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner Friendly' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function CreateHackathonPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'web',
    difficulty: 'all-levels',
    startDate: '',
    endDate: '',
    description: '',
    rules: '',
    judgingCriteria: '',
    prizes: '',
    technologies: '',
    coverImage: '',
    maxParticipants: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        errors.endDate = 'End date must be strictly after the start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the validation errors in the form');
      return;
    }

    setLoading(true);
    try {
      const techArray = formData.technologies
        ? formData.technologies
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        description: formData.description.trim(),
        rules: formData.rules.trim(),
        judgingCriteria: formData.judgingCriteria.trim(),
        prizes: formData.prizes.trim(),
        technologies: techArray,
        coverImage: formData.coverImage.trim(),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : 0,
      };

      const res = await api.post('/hackathons', payload);
      if (res.success && res.data) {
        toast.success('Hackathon hosted successfully! 🚀');
        navigate(`/hackathons/${res.data.slug || res.data._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-hackathon-container animate-fade-in">
      <Link to="/hackathons" className="hackathon-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Cancel and return to Hackathons
      </Link>

      <div className="create-hackathon-card">
        <h1>Host a <span className="grad-text">Developer Hackathon</span></h1>
        <p className="subtitle">
          Create an inspiring competitive challenge for the global DevVerse developer community.
        </p>

        <form onSubmit={handleSubmit} className="hackathon-form">
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Hackathon Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-input ${formErrors.title ? 'error' : ''}`}
              placeholder="e.g. Aurora AI Sprint 2026: Autonomous Agents"
              value={formData.title}
              onChange={handleChange}
            />
            {formErrors.title && <span className="form-error">{formErrors.title}</span>}
          </div>

          {/* Category & Difficulty */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="difficulty">
                Difficulty Level *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                className="form-select"
                value={formData.difficulty}
                onChange={handleChange}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Start Date & Time *
              </label>
              <input
                id="startDate"
                name="startDate"
                type="datetime-local"
                className={`form-input ${formErrors.startDate ? 'error' : ''}`}
                value={formData.startDate}
                onChange={handleChange}
              />
              {formErrors.startDate && <span className="form-error">{formErrors.startDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endDate">
                End Date & Time *
              </label>
              <input
                id="endDate"
                name="endDate"
                type="datetime-local"
                className={`form-input ${formErrors.endDate ? 'error' : ''}`}
                value={formData.endDate}
                onChange={handleChange}
              />
              {formErrors.endDate && <span className="form-error">{formErrors.endDate}</span>}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Overview & Challenge Description *
            </label>
            <textarea
              id="description"
              name="description"
              className={`form-textarea ${formErrors.description ? 'error' : ''}`}
              placeholder="Detail the background, problem statement, what builders need to deliver, and acceptable project formats..."
              rows={5}
              value={formData.description}
              onChange={handleChange}
            />
            {formErrors.description && <span className="form-error">{formErrors.description}</span>}
          </div>

          {/* Rules */}
          <div className="form-group">
            <label className="form-label" htmlFor="rules">
              Rules & Guidelines
            </label>
            <textarea
              id="rules"
              name="rules"
              className="form-textarea"
              placeholder="e.g. All code must be written during the event window. Open-source libraries are permitted. Teams can have up to 4 members..."
              rows={3}
              value={formData.rules}
              onChange={handleChange}
            />
          </div>

          {/* Judging Criteria */}
          <div className="form-group">
            <label className="form-label" htmlFor="judgingCriteria">
              Judging Criteria
            </label>
            <textarea
              id="judgingCriteria"
              name="judgingCriteria"
              className="form-textarea"
              placeholder="e.g. Innovation (30%), Technical Execution (30%), UI/UX Design (20%), Practical Impact (20%)..."
              rows={3}
              value={formData.judgingCriteria}
              onChange={handleChange}
            />
          </div>

          {/* Prizes */}
          <div className="form-group">
            <label className="form-label" htmlFor="prizes">
              Prizes & Rewards
            </label>
            <textarea
              id="prizes"
              name="prizes"
              className="form-textarea"
              placeholder="e.g. 1st Place: $5,000 + Cloud Credits; 2nd Place: $2,500; Best UI: $1,000..."
              rows={2}
              value={formData.prizes}
              onChange={handleChange}
            />
          </div>

          {/* Technologies & Max Participants */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="technologies">
                Featured Technologies
              </label>
              <input
                id="technologies"
                name="technologies"
                type="text"
                className="form-input"
                placeholder="React, Next.js, OpenAI, Solidity (comma separated)"
                value={formData.technologies}
                onChange={handleChange}
              />
              <span className="form-hint">Separate technologies with commas</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maxParticipants">
                Participant Limit (Optional)
              </label>
              <input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="0"
                className="form-input"
                placeholder="Leave blank or 0 for unlimited"
                value={formData.maxParticipants}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="coverImage">
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
          </div>

          {/* Submit Actions */}
          <div className="hackathon-form-actions">
            <Link to="/hackathons" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating Hackathon...
                </>
              ) : (
                'Publish Hackathon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
