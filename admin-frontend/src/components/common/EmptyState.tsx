import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no records matching your current filter criteria.',
  icon
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: 'var(--text-secondary)'
        }}
      >
        {icon || <Inbox size={26} />}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.85rem', maxWidth: 360 }}>{description}</p>
    </div>
  );
};

