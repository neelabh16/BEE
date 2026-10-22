import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Messages.css';

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationPage() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const currentUserId = user?._id || user?.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation info
  const fetchConversationInfo = useCallback(async () => {
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      if (res.success && res.data) {
        setConversation(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load conversation');
    }
  }, [conversationId, toast]);

  // Fetch messages thread
  const fetchMessages = useCallback(async (isPolling = false) => {
    try {
      const res = await api.get(`/messages/${conversationId}?limit=50`);
      if (res.success) {
        const msgList = Array.isArray(res.data) ? res.data : [];
        setMessages(msgList);
        if (!isPolling) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (err) {
      if (!isPolling) {
        toast.error(err.message || 'Failed to load messages');
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [conversationId, toast]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchConversationInfo();
    fetchMessages(false);
  }, [fetchConversationInfo, fetchMessages]);

  // Polling every 5 seconds for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when messages count changes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setContent('');

    try {
      const res = await api.post(`/messages/${conversationId}`, {
        content: trimmed,
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
      setContent(trimmed); // Restore content on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Identify counterpart
  const peer = conversation?.participants?.find(
    (p) => (p._id || p).toString() !== currentUserId?.toString()
  );

  return (
    <div className="chat-page-container animate-fade-in">
      <div className="chat-room-card">
        {/* Chat Room Header */}
        <div className="chat-room-header">
          <div className="chat-header-user">
            <Link to="/messages" className="chat-back-btn" title="Back to Inbox">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>

            {peer?.avatar ? (
              <img src={peer.avatar} alt={peer.displayName} className="avatar avatar-md" />
            ) : (
              <div className="avatar avatar-md avatar-placeholder">
                {(peer?.displayName?.[0] || 'U').toUpperCase()}
              </div>
            )}

            <div>
              <div className="chat-peer-name">
                <Link to={`/profile/${peer?.username || ''}`} style={{ color: 'inherit' }}>
                  {peer?.displayName || 'Teammate'}
                </Link>
                {peer?.username && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                    @{peer.username}
                  </span>
                )}
              </div>
              <span className="chat-peer-title">{peer?.title || 'DevVerse Squad Member'}</span>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setIsRefreshing(true);
                fetchMessages(false);
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? <span className="spinner" /> : '↻ Refresh'}
            </button>
            {peer?.username && (
              <Link to={`/profile/${peer.username}`} className="btn btn-ghost btn-sm">
                Profile
              </Link>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="chat-messages-thread">
          {loading ? (
            <div className="empty-state">
              <div className="spinner spinner-lg" />
              <p style={{ marginTop: 'var(--space-4)' }}>Loading chat thread...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-thread">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h4 style={{ color: 'var(--text-primary)' }}>Start of conversation</h4>
              <p style={{ fontSize: 'var(--text-xs)' }}>
                Send a message to introduce yourself and plan your next build!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId = (msg.sender?._id || msg.sender)?.toString();
              const isOutgoing = senderId === currentUserId?.toString();

              return (
                <div
                  key={msg._id}
                  className={`message-bubble-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}
                >
                  {!isOutgoing && (
                    msg.sender?.avatar ? (
                      <img
                        src={msg.sender.avatar}
                        alt={msg.sender.displayName || 'Sender'}
                        className="message-avatar-small"
                      />
                    ) : (
                      <div className="message-avatar-small avatar-placeholder" style={{ fontSize: '0.7rem' }}>
                        {(msg.sender?.displayName?.[0] || 'U').toUpperCase()}
                      </div>
                    )
                  )}

                  <div className="message-content-group">
                    <div className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                      {msg.content}
                    </div>
                    <span className="message-timestamp">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSend} className="chat-input-bar">
          <input
            type="text"
            className="chat-text-input"
            placeholder="Type a message... (Press Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />

          <button
            type="submit"
            className="chat-send-btn"
            disabled={!content.trim() || sending}
            title="Send Message"
          >
            {sending ? (
              <span className="spinner" style={{ borderTopColor: '#000' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
