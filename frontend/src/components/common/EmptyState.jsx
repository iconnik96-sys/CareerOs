import React from 'react';
import { Button } from './Button';
export const EmptyState = ({ icon, title, description, actionText, onAction, actionIcon }) => {
    return (<div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p className="text-body" style={{ maxWidth: '420px', marginBottom: actionText ? '1.5rem' : '0' }}>
        {description}
      </p>
      {actionText && onAction && (<Button variant="primary" onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>)}
    </div>);
};
