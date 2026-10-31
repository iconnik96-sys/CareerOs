import React from 'react';

/**
 * Standard PageContainer component matching CareerOS operations standard layout.
 * Ensures strict max-width (1440px) and uniform 28px 36px padding across all pages.
 */
export const PageContainer = ({ children, style = {}, className = '', ...props }) => {
  return (
    <div
      className={`page-container ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default PageContainer;

