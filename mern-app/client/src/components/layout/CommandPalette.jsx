import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = [
    { id: 'home', title: 'Home', section: 'Navigation', url: '/' },
    { id: 'dashboard', title: 'Dashboard', section: 'Navigation', url: '/dashboard' },
    { id: 'explore', title: 'Explore Projects', section: 'Navigation', url: '/explore' },
    { id: 'submit-project', title: 'Submit a Project', section: 'Actions', url: '/projects/new' },
    { id: 'communities', title: 'Communities', section: 'Navigation', url: '/communities' },
    { id: 'create-community', title: 'Create Community', section: 'Actions', url: '/communities/new' },
    { id: 'hackathons', title: 'Hackathons', section: 'Navigation', url: '/hackathons' },
    { id: 'squads', title: 'Squad Finder', section: 'Navigation', url: '/squads' },
    { id: 'leaderboard', title: 'Leaderboard', section: 'Navigation', url: '/leaderboard' },
    { id: 'portfolio', title: 'Portfolio Builder', section: 'Navigation', url: '/portfolio' },
    { id: 'codex', title: 'The Codex', section: 'Navigation', url: '/codex' },
    { id: 'write-codex', title: 'Write Codex Entry', section: 'Actions', url: '/codex/new' },
    { id: 'messages', title: 'Direct Messages', section: 'Navigation', url: '/messages' },
    { id: 'settings', title: 'Settings', section: 'Navigation', url: '/settings' },
  ];

  const filtered = query.trim() === ''
    ? commands
    : commands.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.section.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].url);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmdk-overlay open" onClick={onClose}>
      <div className="cmdk-panel glass" onClick={e => e.stopPropagation()}>
        <div className="cmdk-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="cmdk-input"
            placeholder="Type a command or search DevVerse..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmdk-kbd">ESC</kbd>
        </div>

        <div className="cmdk-body">
          {filtered.length === 0 ? (
            <div className="cmdk-empty">No matching commands or pages found.</div>
          ) : (
            <div className="cmdk-results">
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={`cmdk-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => {
                    navigate(item.url);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="cmdk-item-section">{item.section}</span>
                  <span className="cmdk-item-title">{item.title}</span>
                  <span className="cmdk-item-jump">Jump to &rarr;</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
