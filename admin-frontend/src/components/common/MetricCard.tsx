import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' | 'purple' | 'cyan';
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  icon,
  badge
}) => {
  return (
    <div className="metric-card">
      <div className="metric-label">
        <span>{label}</span>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
      <div className="metric-value">{value}</div>
      {(sub || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {sub && <span className="metric-sub">{sub}</span>}
          {badge && (
            <span className={`badge badge-${badge.variant || 'neutral'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

