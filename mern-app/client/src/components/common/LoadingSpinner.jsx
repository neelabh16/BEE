import './LoadingSpinner.css';

export default function LoadingSpinner({
  size = 'md',
  message = null,
  fullScreen = false,
  className = ''
}) {
  const validSizes = ['sm', 'md', 'lg', 'xl'];
  const spinnerSize = validSizes.includes(size) ? size : 'md';

  return (
    <div
      className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className={`loading-spinner-circle size-${spinnerSize}`} />
      {message && <p className="loading-spinner-message">{message}</p>}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        Loading...
      </span>
    </div>
  );
}
