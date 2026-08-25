import React from 'react';
export const LoadingSpinner = ({ size = 28, message }) => {
    return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.75rem' }}>
      <div className="loading-spinner" style={{ width: size, height: size, borderWidth: Math.max(2, size / 8) }}/>
      {message && <p className="text-body text-sm">{message}</p>}
    </div>);
};
