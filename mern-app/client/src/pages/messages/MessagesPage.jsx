import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Messages.css';

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentUserId = user?._id || user?.id;

  const fetchConversations = useCallback(async (showToast = false) => {
    try {
      const res = await api.get('/conversations');
      if (res.success) {
        setConversations(Array.isArray(res.data) ? res.data : []);
        if (showToast) {
          toast.success('Inbox refreshed');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchConversations(true);
  };

  // Helper to get counterpart participant
  const getPeerParticipant = (conv) => {
    if (!conv.participants || !Array.isArray(conv.participants)) return null;
    return conv.participants.find((p) => {
      const pId = p._id || p;
      return pId.toString() !== currentUserId?.toString();
    }) || conv.participants[0];
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const peer = getPeerParticipant(conv);
    const peerName = (peer?.displayName || peer?.username || '').toLowerCase();
    const lastMsg = (conv.lastMessage?.content || '').toLowerCase();
    const query = search.toLowerCase().trim();
    return peerName.includes(query) || lastMsg.includes(query);
  });

  return (
    <div className="messages-page-container animate-fade-in">
      <div className="messages-page-header">
        <div>
          <h1>Direct <span className="grad-text">Messages</span></h1>
          <p className="text-muted text-sm">
            Chat and coordinate with your squad teammates and collaborators.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <span className="spinner" /> : '↻ Refresh'}
          </button>
          <Link to="/squads" className="btn btn-primary btn-sm">
            Find Teammates
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="conversations-search-bar">
        <svg className="conversations-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="conversations-search-input"
          placeholder="Filter conversations by developer or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: 'var(--space-4)' }}>Loading conversations...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h3>No conversations found</h3>
          <p>
            {search
              ? 'No conversations match your search filter.'
              : "You don't have any direct messages yet. Connect with teammates in Squad Finder to start building!"}
          </p>
          {!search && (
            <Link to="/squads" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
              Explore Squad Finder
            </Link>
          )}
        </div>
      ) : (
        <div className="conversations-list">
          {filteredConversations.map((conv) => {
            const peer = getPeerParticipant(conv);
            const unreadCount =
              conv.unreadCount && typeof conv.unreadCount.get === 'function'
                ? conv.unreadCount.get(currentUserId?.toString()) || 0
                : conv.unreadCount?.[currentUserId?.toString()] || 0;

            const isUnread = unreadCount > 0;

            return (
              <Link
                key={conv._id}
                to={`/messages/${conv._id}`}
                className={`conversation-row ${isUnread ? 'unread' : ''}`}
              >
                <div className="conv-avatar-wrapper">
                  {peer?.avatar ? (
                    <img
                      src={peer.avatar}
                      alt={peer.displayName}
                      className="avatar avatar-md"
                    />
                  ) : (
                    <div className="avatar avatar-md avatar-placeholder">
                      {(peer?.displayName?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="conv-info">
                  <div className="conv-info-top">
                    <span className="conv-name">
                      {peer?.displayName || 'Teammate'}
                    </span>
                    <span className="conv-time">
                      {formatMessageTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="conv-preview-row">
                    <span className="conv-snippet">
                      {conv.lastMessage?.content
                        ? `${conv.lastMessage.sender?._id === currentUserId ? 'You: ' : ''}${conv.lastMessage.content}`
                        : 'No messages yet — start the conversation!'}
                    </span>

                    {unreadCount > 0 && (
                      <span className="conv-unread-badge">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
