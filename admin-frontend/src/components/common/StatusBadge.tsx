import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' | 'purple' | 'cyan';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  let resolvedVariant = variant;

  if (!resolvedVariant) {
    const s = status.toLowerCase();
    if (['active', 'success', 'captured', 'paid', 'online'].includes(s)) {
      resolvedVariant = 'success';
    } else if (['pro', 'authorized'].includes(s)) {
      resolvedVariant = 'primary';
    } else if (['ultimate'].includes(s)) {
      resolvedVariant = 'purple';
    } else if (['failed', 'past_due', 'error', 'offline'].includes(s)) {
      resolvedVariant = 'danger';
    } else if (['created', 'attempted', 'pending', 'free'].includes(s)) {
      resolvedVariant = 'warning';
    } else {
      resolvedVariant = 'neutral';
    }
  }

  return (
    <span className={`badge badge-${resolvedVariant}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block'
        }}
      />
      {status.toUpperCase()}
    </span>
  );
};

