import React from 'react';

/**
 * StandardButton matching Admin Console button specs:
 * Primary: #3b82f6 (hover #2563eb)
 * Secondary: rgba(255, 255, 255, 0.08)
 * Sizing: sm (6px 12px), md (9px 16px), lg (12px 24px)
 */
export const StandardButton = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  style = {},
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      style={style}
      {...props}
    >
      {isLoading ? (
        <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

export default StandardButton;

