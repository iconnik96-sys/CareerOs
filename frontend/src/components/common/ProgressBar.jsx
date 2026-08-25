import React from 'react';
export const ProgressBar = ({ value, label, showValue = true, color, height = 8 }) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (<div style={{ width: '100%' }}>
      {(label || showValue) && (<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem' }}>
          {label && <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>}
          {showValue && <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{clamped}%</span>}
        </div>)}
      <div className="progress-bar-container" style={{ height: `${height}px` }}>
        <div className="progress-bar-fill" style={{
            width: `${clamped}%`,
            background: color || undefined
        }}/>
      </div>
    </div>);
};
