import React from 'react';
export const Card = ({ children, title, subtitle, action, icon, className = '', ...props }) => {
    return (<div className={`card ${className}`} {...props}>
      {(title || action) && (<div className="card-header">
          <div>
            <h3 className="card-title">
              {icon}
              {title}
            </h3>
            {subtitle && <p className="text-body text-sm" style={{ marginTop: '2px' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>)}
      {children}
    </div>);
};
