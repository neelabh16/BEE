import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './Codex.css';

const CATEGORIES = [
  { value: 'debugging', label: 'Debugging & Fixes' },
  { value: 'lessons', label: 'Lessons Learned' },
  { value: 'architecture', label: 'Architecture & Design' },
  { value: 'incidents', label: 'Incidents & Postmortems' },
  { value: 'performance', label: 'Performance Optimization' },
  { value: 'career', label: 'Career & Industry Growth' },
  { value: 'mistakes', label: 'Mistakes & Anti-patterns' },
  { value: 'practices', label: 'Best Practices & Standards' },
];

export default function CreateCodexPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const textareaRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'debugging',
    tagsInput: '',
    content: '',
  });

  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formData.content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent =
      formData.content.substring(0, start) +
      replacement +
      formData.content.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  const parsedTags = formData.tagsInput
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be 200 characters or fewer';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a valid category';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length > 20000) {
      newErrors.content = 'Content must be 20,000 characters or fewer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        tags: parsedTags,
        content: formData.content.trim(),
      };

      const res = await api.post('/codex', payload);
      if (res.success && res.data) {
        toast.success('Codex entry published successfully! (+5 XP)');
        navigate(`/codex/${res.data.slug}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create codex entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="codex-detail-container">
      <Link to="/codex" className="codex-back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Cancel & Back to Codex
      </Link>

      <div className="codex-editor-card">
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)' }}>
            Write New Codex Entry
          </h1>
          <p className="text-muted text-sm">
            Share an engineering war story, system architecture rationale, or critical bug resolution with fellow developers.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="codex-form" noValidate>
          {/* Title */}
          <div>
            <div className="field-label">
              <label htmlFor="codex-title">Entry Title *</label>
              <span className="char-counter">{formData.title.length}/200</span>
            </div>
            <input
              id="codex-title"
              type="text"
              name="title"
              className="codex-search-input"
              style={{ paddingLeft: 'var(--space-4)' }}
              placeholder="e.g. How we solved memory leaks in our Node.js background workers"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={200}
              required
            />
            {errors.title && <p className="text-danger text-xs" style={{ marginTop: '4px' }}>{errors.title}</p>}
          </div>

          {/* Row: Category & Tags */}
          <div className="form-row">
            <div>
              <label htmlFor="codex-category" className="field-label">
                Category *
              </label>
              <select
                id="codex-category"
                name="category"
                className="codex-sort-select"
                style={{ width: '100%' }}
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-danger text-xs" style={{ marginTop: '4px' }}>{errors.category}</p>}
            </div>

            <div>
              <div className="field-label">
                <label htmlFor="codex-tags">Tags</label>
                <span className="char-counter">comma-separated</span>
              </div>
              <input
                id="codex-tags"
                type="text"
                name="tagsInput"
                className="codex-search-input"
                style={{ paddingLeft: 'var(--space-4)' }}
                placeholder="react, profiling, mongodb"
                value={formData.tagsInput}
                onChange={handleInputChange}
              />
              <p className="field-help">Add keywords to help others find this entry</p>
            </div>
          </div>

          {/* Tags Chips Preview */}
          {parsedTags.length > 0 && (
            <div className="codex-card-tags" style={{ margin: '0' }}>
              {parsedTags.map((t, idx) => (
                <span key={idx} className="codex-tag">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Editor Header: Tabs & Toolbar */}
          <div>
            <div className="field-label">
              <label htmlFor="codex-content">Content * (Supports Markdown)</label>
              <span className="char-counter">{formData.content.length}/20,000</span>
            </div>

            <div className="editor-tabs">
              <button
                type="button"
                className={`editor-tab-btn ${activeTab === 'write' ? 'active' : ''}`}
                onClick={() => setActiveTab('write')}
              >
                Write
              </button>
              <button
                type="button"
                className={`editor-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
            </div>

            {activeTab === 'write' ? (
              <>
                <div className="editor-toolbar">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertMarkdown('**', '**')}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertMarkdown('*', '*')}
                    title="Italic"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertMarkdown('## ')}
                    title="Heading"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertMarkdown('```\n', '\n```')}
                    title="Code block"
                  >
                    &lt;/&gt;
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertMarkdown('> ')}
                    title="Quote"
                  >
                    ”
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertMarkdown('- ')}
                    title="Bullet List"
                  >
                    • List
                  </button>
                </div>

                <textarea
                  id="codex-content"
                  ref={textareaRef}
                  name="content"
                  className="editor-textarea"
                  placeholder="Detail the challenge, reproduction steps, core architecture decisions, or key takeaways..."
                  value={formData.content}
                  onChange={handleInputChange}
                  maxLength={20000}
                  required
                />
              </>
            ) : (
              <div className="editor-preview-pane codex-content-body">
                {formData.content.trim() ? (
                  formData.content.split('\n\n').map((paragraph, index) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;

                    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
                      const lines = trimmed.split('\n');
                      return (
                        <pre key={index}>
                          <code>{lines.slice(1, -1).join('\n')}</code>
                        </pre>
                      );
                    }
                    if (trimmed.startsWith('## ')) {
                      return <h2 key={index}>{trimmed.replace(/^##\s+/, '')}</h2>;
                    }
                    if (trimmed.startsWith('> ')) {
                      return <blockquote key={index}>{trimmed.replace(/^>\s*/gm, '')}</blockquote>;
                    }
                    return (
                      <p key={index}>
                        {trimmed.split('\n').map((l, i) => (
                          <span key={i}>
                            {l}
                            {i < trimmed.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-dim">Nothing to preview yet. Start writing your entry.</p>
                )}
              </div>
            )}
            {errors.content && <p className="text-danger text-xs" style={{ marginTop: '4px' }}>{errors.content}</p>}
          </div>

          {/* Form Actions */}
          <div className="editor-actions-bar">
            <Link to="/codex" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  Publishing...
                </>
              ) : (
                'Publish Codex Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
