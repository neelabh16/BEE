import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import './Settings.css';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'appearance'

  // Edit Profile Form State
  const [profileData, setProfileData] = useState({
    displayName: '',
    title: '',
    bio: '',
    location: '',
    skills: '',
    avatar: '',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    twitterUrl: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Sync profile data with user context
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        title: user.title || '',
        bio: user.bio || '',
        location: user.location || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
        avatar: user.avatar || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        websiteUrl: user.websiteUrl || '',
        twitterUrl: user.twitterUrl || '',
      });
    }
  }, [user]);

  // Handle Profile Change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setProfileLoading(true);
    try {
      const skillsArray = profileData.skills
        ? profileData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        displayName: profileData.displayName.trim(),
        title: profileData.title.trim(),
        bio: profileData.bio.trim(),
        location: profileData.location.trim(),
        skills: skillsArray,
        avatar: profileData.avatar.trim(),
        githubUrl: profileData.githubUrl.trim(),
        linkedinUrl: profileData.linkedinUrl.trim(),
        websiteUrl: profileData.websiteUrl.trim(),
        twitterUrl: profileData.twitterUrl.trim(),
      };

      const res = await api.put('/users/profile', payload);
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success('Profile settings updated successfully! ✨');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile settings');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.success) {
        toast.success('Password changed successfully! 🔐');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
      toast.error(err.message || 'Password update failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <h1>Account <span className="grad-text">Settings</span></h1>
        <p>Manage your developer identity, security preferences, and interface theme.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="settings-tabs-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Edit Profile
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Security & Password
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          Appearance
        </button>
      </div>

      {/* Tab 1: Edit Profile */}
      {activeTab === 'profile' && (
        <div className="settings-card animate-fade-in">
          <div className="settings-card-header">
            <h2>Public Profile</h2>
            <p>This information is visible across DevVerse showcase, squads, and leaderboards.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="settings-form">
            {/* Avatar URL & Preview */}
            <div className="form-group">
              <label className="form-label">Profile Avatar</label>
              <div className="settings-avatar-preview-row">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt="Preview"
                    className="settings-avatar-preview"
                    onError={(e) => {
                      e.target.src = '';
                    }}
                  />
                ) : (
                  <div className="settings-avatar-preview avatar-placeholder" style={{ fontSize: '1.4rem' }}>
                    {(profileData.displayName?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="url"
                    name="avatar"
                    className="form-input"
                    placeholder="https://images.unsplash.com/... or avatar image URL"
                    value={profileData.avatar}
                    onChange={handleProfileChange}
                  />
                  <span className="form-hint">Paste an image URL for your profile picture</span>
                </div>
              </div>
            </div>

            {/* Display Name & Title */}
            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="displayName">
                  Display Name *
                </label>
                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  className="form-input"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Developer Title / Role
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="e.g. Senior Backend Engineer & Cloud Architect"
                  value={profileData.title}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label className="form-label" htmlFor="bio">
                Bio & Engineering Focus
              </label>
              <textarea
                id="bio"
                name="bio"
                className="form-textarea"
                rows={3}
                placeholder="Tell the DevVerse community what you're passionate about building..."
                value={profileData.bio}
                onChange={handleProfileChange}
              />
            </div>

            {/* Location & Skills */}
            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g. San Francisco, CA / Remote"
                  value={profileData.location}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="skills">
                  Primary Skills
                </label>
                <input
                  id="skills"
                  type="text"
                  name="skills"
                  className="form-input"
                  placeholder="React, Node.js, Go, Kubernetes (comma separated)"
                  value={profileData.skills}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="githubUrl">
                  GitHub Profile URL
                </label>
                <input
                  id="githubUrl"
                  type="url"
                  name="githubUrl"
                  className="form-input"
                  placeholder="https://github.com/username"
                  value={profileData.githubUrl}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="linkedinUrl">
                  LinkedIn URL
                </label>
                <input
                  id="linkedinUrl"
                  type="url"
                  name="linkedinUrl"
                  className="form-input"
                  placeholder="https://linkedin.com/in/username"
                  value={profileData.linkedinUrl}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="websiteUrl">
                  Portfolio / Website
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  name="websiteUrl"
                  className="form-input"
                  placeholder="https://yourportfolio.dev"
                  value={profileData.websiteUrl}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="twitterUrl">
                  Twitter / X Profile
                </label>
                <input
                  id="twitterUrl"
                  type="url"
                  name="twitterUrl"
                  className="form-input"
                  placeholder="https://twitter.com/handle"
                  value={profileData.twitterUrl}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="settings-actions-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileLoading}
              >
                {profileLoading ? (
                  <>
                    <span className="spinner" /> Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Change Password */}
      {activeTab === 'password' && (
        <div className="settings-card animate-fade-in">
          <div className="settings-card-header">
            <h2>Change Password</h2>
            <p>Ensure your account uses a secure, unique password.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Current Password *
              </label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                className="form-input"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  New Password *
                </label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-type new password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>

            {passwordError && (
              <span className="form-error" style={{ display: 'block' }}>
                {passwordError}
              </span>
            )}

            <div className="settings-actions-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <span className="spinner" /> Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Appearance */}
      {activeTab === 'appearance' && (
        <div className="settings-card animate-fade-in">
          <div className="settings-card-header">
            <h2>Appearance & Accent Colors</h2>
            <p>Customize the visual personality of your DevVerse workspace.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>Theme Mode</h4>
            <div className="appearance-theme-grid">
              <div
                className={`theme-choice-card ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="theme-preview-box dark">
                  <div className="theme-preview-bar" />
                  <div className="theme-preview-sub" />
                </div>
                <div className="theme-choice-title">
                  <span>🌙 Dark Theme (OS Cyber)</span>
                  {theme === 'dark' && <span style={{ color: 'var(--accent)' }}>✓ Active</span>}
                </div>
                <p className="theme-choice-desc">
                  High-contrast cyber developer dark palette optimized for late-night building and reduced eye strain.
                </p>
              </div>

              <div
                className={`theme-choice-card ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="theme-preview-box light">
                  <div className="theme-preview-bar" />
                  <div className="theme-preview-sub" />
                </div>
                <div className="theme-choice-title">
                  <span>☀️ Light Theme</span>
                  {theme === 'light' && <span style={{ color: 'var(--accent)' }}>✓ Active</span>}
                </div>
                <p className="theme-choice-desc">
                  Clean, modern light documentation aesthetic for daylight readability and presentation modes.
                </p>
              </div>
            </div>
          </div>

          {/* Accent Color Swatches */}
          <div style={{ marginBottom: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '6px' }}>Accent Color</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Sets the highlight color used across buttons, links, glows, and badges.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { id: 'violet', label: 'Violet', bg: 'var(--violet)' },
                { id: 'cyan', label: 'Cyan', bg: 'var(--cyan)' },
                { id: 'coral', label: 'Coral', bg: 'var(--coral)' },
                { id: 'amber', label: 'Amber', bg: 'var(--amber)' },
                { id: 'legend', label: 'Legend', bg: 'conic-gradient(#f0c419, var(--coral), var(--violet), var(--cyan), #f0c419)' },
              ].map((sw) => (
                <button
                  key={sw.id}
                  type="button"
                  className={`swatch ${accent === sw.id ? 'active' : ''}`}
                  onClick={() => setAccent(sw.id)}
                  style={{
                    background: sw.bg,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: accent === sw.id ? '3px solid #fff' : '2px solid transparent',
                    boxShadow: accent === sw.id ? '0 0 16px var(--accent)' : 'none',
                    cursor: 'pointer',
                    transform: accent === sw.id ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                  title={`${sw.label} accent`}
                />
              ))}
            </div>
          </div>

          {/* Motion Toggle */}
          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Interface Animations & Particles</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Controls floating particle dust, background aurora shifts, and card lift transitions.
                </p>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${motion === 'on' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setMotion(prev => prev === 'on' ? 'off' : 'on')}
              >
                Motion: {motion.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
