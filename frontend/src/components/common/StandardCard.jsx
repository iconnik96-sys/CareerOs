import React from 'react';

/**
 * StandardCard matching Admin Dashboard card design tokens.
 * Background: var(--bg-card), border: 1px solid var(--border-color), radius: 14px, padding: 24px (sm: 16px 20px).
 */
export const StandardCard = ({
  children,
  title,
  subtitle,
  action,
  icon,
  size = 'md', // 'sm' | 'md'
  className = '',
  style = {},
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'card-sm' : '';
  return (
    <div className={`card ${sizeClass} ${className}`} style={style} {...props}>
      {(title || action) && (
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {icon}
              {title}
            </h3>
            {subtitle && (
              <p className="text-body text-sm" style={{ marginTop: 2, color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default StandardCard;

