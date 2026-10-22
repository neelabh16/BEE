import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.displayName.trim()) errs.displayName = 'Display name is required';
    else if (formData.displayName.trim().length < 2) errs.displayName = 'At least 2 characters';

    if (!formData.username.trim()) errs.username = 'Username is required';
    else if (!/^[a-z0-9_-]{3,30}$/.test(formData.username.trim().toLowerCase()))
      errs.username = '3-30 lowercase letters, numbers, hyphens, or underscores';

    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim()))
      errs.email = 'Invalid email format';

    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'At least 6 characters';

    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await register({
        displayName: formData.displayName.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="grad-text">DevVerse</span>
          </Link>
          <h1>Create your account</h1>
          <p className="text-muted">Join the developer ecosystem</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="auth-error">{errors.form}</div>}

          <div className="form-group">
            <label htmlFor="displayName" className="form-label">Display Name</label>
            <input id="displayName" name="displayName" type="text"
              className={`form-input ${errors.displayName ? 'error' : ''}`}
              placeholder="Your Name" value={formData.displayName}
              onChange={handleChange} disabled={loading} autoComplete="name" />
            {errors.displayName && <span className="form-error">{errors.displayName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input id="username" name="username" type="text"
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="your-username" value={formData.username}
              onChange={handleChange} disabled={loading} autoComplete="username" />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input id="email" name="email" type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com" value={formData.email}
              onChange={handleChange} disabled={loading} autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input id="password" name="password" type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Min 6 characters" value={formData.password}
              onChange={handleChange} disabled={loading} autoComplete="new-password" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Re-enter your password" value={formData.confirmPassword}
              onChange={handleChange} disabled={loading} autoComplete="new-password" />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
