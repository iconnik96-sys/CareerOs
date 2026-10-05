import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Unhandled React Application Error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                }}>
                    <div className="card" style={{
                        maxWidth: '520px',
                        width: '100%',
                        padding: '2.5rem',
                        textAlign: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem auto'
                        }}>
                            <AlertTriangle size={28} />
                        </div>

                        <h2 className="text-h2" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h2>

                        <p className="text-body text-sm" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            CareerOS encountered an unexpected error while rendering this page. Your saved data is safe.
                        </p>

                        {this.state.error?.message && (
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                color: 'var(--danger)',
                                fontFamily: 'monospace',
                                marginBottom: '1.5rem',
                                textAlign: 'left',
                                overflowX: 'auto'
                            }}>
                                {this.state.error.message}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <Button variant="secondary" onClick={this.handleReload} leftIcon={<RefreshCw size={16} />}>
                                Reload Page
                            </Button>
                            <Button variant="primary" onClick={this.handleReset} leftIcon={<Home size={16} />}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
