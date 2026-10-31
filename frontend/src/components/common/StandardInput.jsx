import React, { forwardRef } from 'react';

/**
 * StandardInput matching Admin Console form fields:
 * Background: #090e1a, border: rgba(255, 255, 255, 0.08), radius: 10px, padding: 9px 14px.
 */
export const StandardInput = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerStyle = {},
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group" style={containerStyle}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`input ${className}`}
          style={{
            paddingLeft: leftIcon ? 38 : 14,
            paddingRight: rightIcon ? 38 : 14,
            borderColor: error ? 'var(--danger)' : undefined
          }}
          {...props}
        />
        {rightIcon && (
          <span style={{ position: 'absolute', right: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}
    </div>
  );
});

StandardInput.displayName = 'StandardInput';
export default StandardInput;

