import React from 'react';
export const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, className = '', disabled, ...props }) => {
    const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
    const variantClass = `btn-${variant}`;
    return (<button className={`btn ${variantClass} ${sizeClass} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? (<span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}/>) : (leftIcon)}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>);
};
