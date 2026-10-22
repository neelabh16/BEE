import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

export default function SearchBar({
  placeholder = 'Search...',
  onSearch = () => {},
  defaultValue = '',
  delay = 300,
  className = ''
}) {
  const [query, setQuery] = useState(defaultValue);
  const isFirstRender = useRef(true);

  // Debounced search trigger
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (defaultValue) {
        onSearch(defaultValue);
      }
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query.trim());
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, onSearch, defaultValue]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`search-bar-wrapper ${className}`.trim()}>
      <svg
        className="search-bar-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={placeholder}
      />

      {query && (
        <button
          type="button"
          className="search-bar-clear-btn"
          onClick={handleClear}
          aria-label="Clear search input"
          title="Clear search"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
