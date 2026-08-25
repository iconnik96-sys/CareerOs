import React from 'react';
export const Badge = ({ children, variant = 'neutral', icon, className = '', ...props }) => {
    return (<span className={`badge badge-${variant} ${className}`} {...props}>
      {icon}
      <span>{children}</span>
    </span>);
};
