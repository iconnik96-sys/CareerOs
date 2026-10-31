import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Standard ErrorState component matching Admin Console clean error presentation.
 */
export const ErrorState = ({
  title = 'Unable to load content',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  minHeight = 240,
  style = {}
}) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight,
        padding: '32px 24px',
        borderColor: 'rgba(239, 68, 68, 0.25)',
        backgroundColor: 'rgba(239, 68, 68, 0.04)',
        gap: 12,
        ...style
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          backgroundColor: 'var(--danger-subtle)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AlertTriangle size={20} />
      </div>
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
          {title}
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 440 }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 6 }}
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;

