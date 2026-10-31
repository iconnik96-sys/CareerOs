import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 38,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-md)',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

