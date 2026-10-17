import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export const InconvenienceNotice = ({
    title = 'Sorry for the Inconvenience',
    message = 'The service is temporarily unavailable. To ensure complete accuracy and transparency, we do not show simulated or unverified mock data.',
    details = null,
    onRetry = null,
    retryText = 'Try Again',
    secondaryActionText = null,
    onSecondaryAction = null,
    style = {}
}) => {
    return (
        <div
            className="inconvenience-notice-card"
            style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(245, 158, 11, 0.04))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.75rem',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                maxWidth: '680px',
                margin: '1.5rem auto',
                ...style
            }}
        >
            <div
                style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem auto',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
            >
                <AlertTriangle size={26} />
            </div>

            <h3
                style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.625rem',
                    letterSpacing: '-0.01em'
                }}
            >
                {title}
            </h3>

            <p
                style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    maxWidth: '560px',
                    margin: '0 auto 1.25rem auto'
                }}
            >
                {message}
            </p>

            {details && (
                <div
                    style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.625rem 0.875rem',
                        fontSize: '0.8125rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-muted)',
                        maxWidth: '560px',
                        margin: '0 auto 1.5rem auto',
                        wordBreak: 'break-word',
                        textAlign: 'left'
                    }}
                >
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Error Details: </span>
                    {typeof details === 'string' ? details : details.message || JSON.stringify(details)}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                }}
            >
                {onRetry && (
                    <Button
                        variant="primary"
                        onClick={onRetry}
                        leftIcon={<RefreshCw size={15} />}
                    >
                        {retryText}
                    </Button>
                )}
                {secondaryActionText && onSecondaryAction && (
                    <Button
                        variant="secondary"
                        onClick={onSecondaryAction}
                        leftIcon={<ArrowLeft size={15} />}
                    >
                        {secondaryActionText}
                    </Button>
                )}
            </div>
        </div>
    );
};
