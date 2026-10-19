import React from 'react';

export const CircularProgress = ({
    percentage,
    value,
    size = 140,
    strokeWidth = 10,
    label,
    subtitle,
    color,
    showLabel = true,
    children
}) => {
    const rawVal = typeof percentage === 'number' ? percentage : (typeof value === 'number' ? value : 0);
    const validPercentage = Math.max(0, Math.min(100, Math.round(rawVal)));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (validPercentage / 100) * circumference;

    const getStrokeColor = () => {
        if (!color) return 'url(#progressGradient)';
        if (color === 'success') return 'var(--success, #10b981)';
        if (color === 'warning') return 'var(--warning, #f59e0b)';
        if (color === 'danger') return 'var(--danger, #ef4444)';
        if (color === 'primary') return 'var(--primary, #3b82f6)';
        if (color === 'neutral') return 'var(--text-muted, #64748b)';
        return color;
    };

    return (
        <div className="circular-progress-wrap" style={{ width: size, height: size }}>
            <svg className="circular-progress-svg" width={size} height={size}>
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6"/>
                        <stop offset="100%" stopColor="#6366f1"/>
                    </linearGradient>
                </defs>
                <circle className="circular-progress-bg" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2}/>
                <circle className="circular-progress-bar" stroke={getStrokeColor()} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} fill="transparent" r={radius} cx={size / 2} cy={size / 2}/>
            </svg>
            {children ? (
                <div className="circular-progress-label">
                    {children}
                </div>
            ) : showLabel ? (
                <div className="circular-progress-label">
                    <span style={{ fontSize: `${Math.max(11, size * 0.22)}px`, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                        {validPercentage}%
                    </span>
                    {label && (
                        <span style={{ fontSize: `${Math.max(9, size * 0.08)}px`, color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                            {label}
                        </span>
                    )}
                    {subtitle && (
                        <span style={{ fontSize: `${Math.max(8, size * 0.07)}px`, color: 'var(--text-muted)' }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            ) : null}
        </div>
    );
};
