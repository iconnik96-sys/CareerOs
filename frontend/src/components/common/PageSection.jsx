import React from 'react';

/**
 * Standard PageSection component for consistent section vertical rhythm and titles.
 */
export const PageSection = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <section
      className={`page-section ${className}`}
      style={{ marginBottom: 24, ...style }}
      {...props}
    >
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            {title && (
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

export default PageSection;

