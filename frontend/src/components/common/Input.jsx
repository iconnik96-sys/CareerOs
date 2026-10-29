import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(({ label, error, helperText, leftIcon, rightIcon, className = '', id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (<div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (<div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
            {leftIcon}
          </div>)}
        <input id={inputId} ref={ref} type={computedType} className={`form-input ${error ? 'border-danger' : ''} ${className}`} style={{
            paddingLeft: leftIcon ? '38px' : '14px',
            paddingRight: (rightIcon || isPassword) ? '38px' : '14px'
        }} {...props}/>
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: showPassword ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = showPassword ? 'var(--primary)' : 'var(--text-muted)'; }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : (
          rightIcon && (<div style={{ position: 'absolute', right: '12px', color: 'var(--text-muted)', display: 'flex' }}>
              {rightIcon}
            </div>)
        )}
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}
    </div>);
});
Input.displayName = 'Input';

