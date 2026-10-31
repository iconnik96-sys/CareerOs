import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard LoadingState component for page-level or card-level loading transitions.
 */
export const LoadingState = ({ message = 'Loading data...', minHeight = 240, style = {} }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        gap: 12,
        color: 'var(--text-muted)',
        ...style
      }}
    >
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{message}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;

