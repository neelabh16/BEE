import { Link } from 'react-router-dom';
import './EmptyState.css';

export default function EmptyState({
  icon,
  title = 'No data found',
  message,
  actionLabel,
  onAction,
  actionLink,
  action,
  className = ''
}) {
  const defaultIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );

  return (
    <div className={`empty-state-wrapper empty-state ${className}`.trim()}>
      <div className="empty-state-icon-box">
        {icon || defaultIcon}
      </div>

      {title && <h3 className="empty-state-title">{title}</h3>}
      {message && <p className="empty-state-message">{message}</p>}

      {(action || actionLabel) && (
        <div className="empty-state-actions">
          {action ? (
            action
          ) : actionLink ? (
            <Link to={actionLink} className="btn btn-primary">
              {actionLabel}
            </Link>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
