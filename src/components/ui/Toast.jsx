import { useState } from 'react';

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const BG_COLORS = {
  success: 'bg-success-bg border-success',
  error: 'bg-error-bg border-error',
  info: 'bg-accent-light border-accent',
};

const ICON_COLORS = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-accent',
};

export default function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border rounded-lg shadow-pop bg-surface text-sm max-w-sm transition-all duration-300 ${
        exiting ? 'animate-fade-out opacity-0' : 'animate-slide-up'
      } ${BG_COLORS[toast.type] || 'bg-surface border-border'}`}
    >
      <span className={`flex-shrink-0 mt-0.5 ${ICON_COLORS[toast.type] || 'text-text-secondary'}`}>
        {ICONS[toast.type] || ICONS.info}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-text-primary">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            onClick={() => { toast.action.onClick(); handleDismiss(); }}
            className="mt-1 text-xs font-medium text-link hover:underline transition-colors duration-base"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-accent-light transition-colors duration-base"
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
