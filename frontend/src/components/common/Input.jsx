import React from 'react';
export const Input = React.forwardRef(({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (<div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (<div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
            {leftIcon}
          </div>)}
        <input id={inputId} ref={ref} className={`form-input ${error ? 'border-danger' : ''} ${className}`} style={{
            paddingLeft: leftIcon ? '38px' : '14px',
            paddingRight: rightIcon ? '38px' : '14px'
        }} {...props}/>
        {rightIcon && (<div style={{ position: 'absolute', right: '12px', color: 'var(--text-muted)', display: 'flex' }}>
            {rightIcon}
          </div>)}
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}
    </div>);
});
Input.displayName = 'Input';
