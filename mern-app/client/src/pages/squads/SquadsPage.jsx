import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Squads.css';

const SKILL_SUGGESTIONS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'AI / ML',
  'Next.js',
  'Rust',
  'Solidity',
  'UI / UX',
  'Docker',
];

export default function SquadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('find'); // 'find', 'received', 'sent', 'connections'

  // Find Teammates State
  const [developers, setDevelopers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [devsLoading, setDevsLoading] = useState(false);
  const [devsError, setDevsError] = useState(null);

  // Requests & Connections State
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [receivedLoading, setReceivedLoading] = useState(false);

  const [sentRequests, setSentRequests] = useState([]);
  const [sentLoading, setSentLoading] = useState(false);

  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Modal State for Connect Request
  const [selectedDev, setSelectedDev] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestGoals, setRequestGoals] = useState('');
  const [requestSkills, setRequestSkills] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Message conversation loading state
  const [msgLoadingId, setMsgLoadingId] = useState(null);

  // 1. Fetch Developers for Squad Finder
  const fetchDevelopers = useCallback(async () => {
    setDevsLoading(true);
    setDevsError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedSkill) params.append('skills', selectedSkill);
      params.append('limit', 12);

      const res = await api.get(`/squads/search?${params.toString()}`);
      if (res.success) {
        setDevelopers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setDevsError(err.message || 'Failed to search developers');
    } finally {
      setDevsLoading(false);
    }
  }, [searchQuery, selectedSkill]);

  // 2. Fetch Received Requests
  const fetchReceivedRequests = useCallback(async () => {
    setReceivedLoading(true);
    try {
      const res = await api.get('/squads/requests/received');
      if (res.success) {
        setReceivedRequests(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      toast.error('Failed to load received requests');
    } finally {
      setReceivedLoading(false);
    }
  }, [toast]);

  // 3. Fetch Sent Requests
  const fetchSentRequests = useCallback(async () => {
    setSentLoading(true);
    try {
      const res = await api.get('/squads/requests/sent');
      if (res.success) {
        setSentRequests(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      toast.error('Failed to load sent requests');
    } finally {
      setSentLoading(false);
    }
  }, [toast]);

  // 4. Fetch Connections
  const fetchConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await api.get('/squads/connections');
      if (res.success) {
        setConnections(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      toast.error('Failed to load squad connections');
    } finally {
      setConnectionsLoading(false);
    }
  }, [toast]);

  // Initial loads
  useEffect(() => {
    fetchDevelopers();
    fetchReceivedRequests();
  }, [fetchDevelopers, fetchReceivedRequests]);

  useEffect(() => {
    if (activeTab === 'received') fetchReceivedRequests();
    if (activeTab === 'sent') fetchSentRequests();
    if (activeTab === 'connections') fetchConnections();
  }, [activeTab, fetchReceivedRequests, fetchSentRequests, fetchConnections]);

  // Respond to request (accept or reject)
  const handleRespondRequest = async (requestId, status) => {
    try {
      const res = await api.put(`/squads/requests/${requestId}`, { status });
      if (res.success) {
        toast.success(`Request ${status === 'accepted' ? 'accepted! Teammate connected.' : 'declined.'}`);
        setReceivedRequests((prev) => prev.filter((r) => r._id !== requestId));
        if (status === 'accepted') {
          fetchConnections();
        }
      }
    } catch (err) {
      toast.error(err.message || `Failed to ${status} request`);
    }
  };

  // Open Connect Modal
  const openConnectModal = (dev) => {
    setSelectedDev(dev);
    setRequestMessage(`Hey ${dev.displayName}, I'd love to connect and collaborate with you on DevVerse projects!`);
    setRequestGoals('Hackathons & Project building');
    setRequestSkills(Array.isArray(user?.skills) ? user.skills.slice(0, 3).join(', ') : '');
  };

  // Send Squad Request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedDev) return;

    setSendingRequest(true);
    try {
      const skillsArray = requestSkills
        ? requestSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await api.post('/squads/request', {
        receiverId: selectedDev._id,
        message: requestMessage.trim(),
        goals: requestGoals.trim(),
        skills: skillsArray,
      });

      if (res.success) {
        toast.success(`Squad request sent to ${selectedDev.displayName}!`);
        setSelectedDev(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send squad request');
    } finally {
      setSendingRequest(false);
    }
  };

  // Open Direct Message / Conversation
  const handleOpenConversation = async (peerUserId) => {
    setMsgLoadingId(peerUserId);
    try {
      const res = await api.post('/conversations', { recipientId: peerUserId });
      if (res.success && res.data) {
        navigate(`/messages/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to open conversation');
    } finally {
      setMsgLoadingId(null);
    }
  };

  return (
    <div className="squads-container animate-fade-in">
      {/* Header */}
      <div className="squads-header">
        <h1>
          Squad <span className="grad-text">Finder & Teammates</span>
        </h1>
        <p>
          Discover skilled developers, form high-performance project squads, build together, and conquer hackathons.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="squads-tabs-nav">
        <button
          type="button"
          className={`squad-tab-btn ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Find Teammates
        </button>

        <button
          type="button"
          className={`squad-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          Received Requests
          {receivedRequests.length > 0 && (
            <span className="tab-badge">{receivedRequests.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`squad-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Sent Requests
        </button>

        <button
          type="button"
          className={`squad-tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          My Squad Connections
        </button>
      </div>

      {/* Tab 1: Find Teammates */}
      {activeTab === 'find' && (
        <div className="tab-content animate-fade-in">
          <div className="squads-search-bar">
            <div className="squads-input-row">
              <svg className="squads-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="squads-search-input"
                placeholder="Search developers by name, title, bio, or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="squads-skill-filters">
              <span className="text-dim text-xs font-medium">Filter by skill:</span>
              <button
                type="button"
                className={`skill-filter-pill ${selectedSkill === '' ? 'active' : ''}`}
                onClick={() => setSelectedSkill('')}
              >
                All Skills
              </button>
              {SKILL_SUGGESTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`skill-filter-pill ${selectedSkill === skill ? 'active' : ''}`}
                  onClick={() => setSelectedSkill(selectedSkill === skill ? '' : skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {devsLoading ? (
            <div className="empty-state">
              <div className="spinner spinner-lg" />
              <p style={{ marginTop: 'var(--space-4)' }}>Searching for elite builders...</p>
            </div>
          ) : devsError ? (
            <div className="empty-state">
              <p>{devsError}</p>
            </div>
          ) : developers.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <h3>No developers found</h3>
              <p>Try searching for a different skill or clear your search query to see more builders.</p>
            </div>
          ) : (
            <div className="developers-grid">
              {developers.map((dev) => (
                <div key={dev._id} className="developer-card">
                  <div className="developer-card-top">
                    <div className="dev-avatar-wrapper">
                      {dev.avatar ? (
                        <img src={dev.avatar} alt={dev.displayName} className="dev-avatar" />
                      ) : (
                        <div className="dev-avatar avatar-placeholder">
                          {(dev.displayName?.[0] || 'D').toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="dev-info">
                      <Link to={`/profile/${dev.username}`} className="dev-name">
                        {dev.displayName}
                      </Link>
                      <span className="dev-handle">@{dev.username}</span>
                      <span className="dev-title">{dev.title || 'Full Stack Engineer'}</span>

                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <span className="dev-xp-tag">⚡ {dev.score || 0} XP</span>
                        {dev.location && (
                          <span className="dev-location">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {dev.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="dev-bio">
                    {dev.bio || 'Building the future of software with clean code and modern architecture.'}
                  </p>

                  <div className="dev-skills-row">
                    {dev.skills && dev.skills.length > 0 ? (
                      dev.skills.slice(0, 5).map((sk, idx) => (
                        <span key={idx} className="dev-skill-chip">
                          #{sk}
                        </span>
                      ))
                    ) : (
                      <span className="dev-skill-chip">#javascript</span>
                    )}
                  </div>

                  <div className="developer-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => openConnectModal(dev)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Connect
                    </button>
                    <Link
                      to={`/profile/${dev.username}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Received Requests */}
      {activeTab === 'received' && (
        <div className="tab-content animate-fade-in">
          {receivedLoading ? (
            <div className="empty-state">
              <div className="spinner spinner-lg" />
              <p style={{ marginTop: 'var(--space-4)' }}>Loading received requests...</p>
            </div>
          ) : receivedRequests.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <h3>No pending requests</h3>
              <p>You have responded to all incoming squad connection requests.</p>
            </div>
          ) : (
            <div className="requests-list">
              {receivedRequests.map((req) => (
                <div key={req._id} className="request-card">
                  <div className="request-user-meta">
                    {req.sender?.avatar ? (
                      <img src={req.sender.avatar} alt={req.sender.displayName} className="dev-avatar" />
                    ) : (
                      <div className="dev-avatar avatar-placeholder">
                        {(req.sender?.displayName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div className="request-details">
                      <Link to={`/profile/${req.sender?.username}`} className="dev-name">
                        {req.sender?.displayName}
                      </Link>
                      <span className="dev-handle">@{req.sender?.username}</span>
                      <span className="dev-title">{req.sender?.title || 'Engineer'}</span>

                      {req.message && (
                        <div className="request-message-box">"{req.message}"</div>
                      )}

                      {req.goals && (
                        <div className="request-goals-tag">
                          <span>🎯 Target: {req.goals}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRespondRequest(req._id, 'rejected')}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRespondRequest(req._id, 'accepted')}
                    >
                      Accept Teammate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sent Requests */}
      {activeTab === 'sent' && (
        <div className="tab-content animate-fade-in">
          {sentLoading ? (
            <div className="empty-state">
              <div className="spinner spinner-lg" />
              <p style={{ marginTop: 'var(--space-4)' }}>Loading sent requests...</p>
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <h3>No requests sent yet</h3>
              <p>Explore the Find Teammates tab and reach out to engineers you'd like to squad up with!</p>
            </div>
          ) : (
            <div className="requests-list">
              {sentRequests.map((req) => {
                const statusBadge =
                  req.status === 'accepted'
                    ? 'badge-success'
                    : req.status === 'rejected'
                    ? 'badge-danger'
                    : 'badge-warning';

                return (
                  <div key={req._id} className="request-card">
                    <div className="request-user-meta">
                      {req.receiver?.avatar ? (
                        <img src={req.receiver.avatar} alt={req.receiver.displayName} className="dev-avatar" />
                      ) : (
                        <div className="dev-avatar avatar-placeholder">
                          {(req.receiver?.displayName?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <div className="request-details">
                        <Link to={`/profile/${req.receiver?.username}`} className="dev-name">
                          {req.receiver?.displayName}
                        </Link>
                        <span className="dev-handle">@{req.receiver?.username}</span>
                        <span className="dev-title">{req.receiver?.title || 'Engineer'}</span>

                        {req.message && (
                          <div className="request-message-box">"{req.message}"</div>
                        )}
                      </div>
                    </div>

                    <div className="request-actions">
                      <span className={`badge ${statusBadge}`} style={{ textTransform: 'capitalize' }}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: My Connections */}
      {activeTab === 'connections' && (
        <div className="tab-content animate-fade-in">
          {connectionsLoading ? (
            <div className="empty-state">
              <div className="spinner spinner-lg" />
              <p style={{ marginTop: 'var(--space-4)' }}>Loading squad connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>No teammates yet</h3>
              <p>Once your squad connection requests are accepted, your teammates will appear here for quick collaboration.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={() => setActiveTab('find')}
              >
                Find Teammates Now
              </button>
            </div>
          ) : (
            <div className="connections-grid">
              {connections.map((conn) => {
                const peer = conn.user;
                if (!peer) return null;
                return (
                  <div key={conn.requestId || peer._id} className="connection-card">
                    <div className="connection-card-top">
                      {peer.avatar ? (
                        <img src={peer.avatar} alt={peer.displayName} className="dev-avatar" />
                      ) : (
                        <div className="dev-avatar avatar-placeholder">
                          {(peer.displayName?.[0] || 'T').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link to={`/profile/${peer.username}`} className="dev-name">
                          {peer.displayName}
                        </Link>
                        <span className="dev-handle">@{peer.username}</span>
                        <span className="dev-title">{peer.title || 'Squad Engineer'}</span>
                      </div>
                    </div>

                    <p className="dev-bio">
                      {peer.bio || 'Squad teammate collaborating on DevVerse challenges.'}
                    </p>

                    <div className="dev-skills-row">
                      {peer.skills && peer.skills.length > 0
                        ? peer.skills.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="dev-skill-chip">
                              #{s}
                            </span>
                          ))
                        : null}
                    </div>

                    <div className="connection-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleOpenConversation(peer._id)}
                        disabled={msgLoadingId === peer._id}
                      >
                        {msgLoadingId === peer._id ? (
                          <span className="spinner" />
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Message
                          </>
                        )}
                      </button>

                      <Link
                        to={`/profile/${peer.username}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Connect Request Modal */}
      {selectedDev && (
        <div className="modal-overlay" onClick={() => setSelectedDev(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect with {selectedDev.displayName}</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedDev(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendRequest}>
              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  {selectedDev.avatar ? (
                    <img src={selectedDev.avatar} alt={selectedDev.displayName} className="avatar avatar-sm" />
                  ) : (
                    <div className="avatar avatar-sm avatar-placeholder">
                      {(selectedDev.displayName?.[0] || 'D').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                      {selectedDev.displayName}
                    </span>
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      @{selectedDev.username}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Collaboration Goals</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hackathon Team, SaaS Project, Open Source"
                    value={requestGoals}
                    onChange={(e) => setRequestGoals(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Personal Note / Pitch</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Introduce yourself and propose what you could build together..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Skills You Bring</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Node.js, React, Smart Contracts"
                    value={requestSkills}
                    onChange={(e) => setRequestSkills(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedDev(null)}
                  disabled={sendingRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={sendingRequest}
                >
                  {sendingRequest ? <span className="spinner" /> : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
