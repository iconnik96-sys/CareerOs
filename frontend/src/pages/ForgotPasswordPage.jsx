import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Mail, ArrowLeft, CheckCircle2, RotateCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const { resetPassword } = useAuth();
    const { showToast } = useToast();

    // Cooldown countdown timer for rate limiting protection
    useEffect(() => {
        if (cooldown <= 0) return;
        const interval = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldown]);

    const handleSendReset = async (e) => {
        if (e) e.preventDefault();
        if (!email.trim()) {
            showToast('Please enter your email address', 'warning');
            return;
        }

        if (cooldown > 0) {
            showToast(`Please wait ${cooldown}s before requesting another reset email.`, 'info');
            return;
        }

        setLoading(true);
        const { error } = await resetPassword(email.trim());
        setLoading(false);

        if (error) {
            const errStr = (typeof error === 'string' ? error : error?.message || '').toLowerCase();
            if (errStr.includes('rate limit') || errStr.includes('over_email_send_rate_limit') || errStr.includes('seconds')) {
                setCooldown(60);
                showToast(
                    'For security, password reset requests are limited to once every 60 seconds. Please check your inbox or wait before retrying.',
                    'warning',
                    'Rate Limit Active'
                );
            } else {
                showToast(error, 'error', 'Reset Failed');
            }
        } else {
            setSubmitted(true);
            setCooldown(60);
            showToast('Password reset link has been dispatched to your email.', 'success', 'Link Sent');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-primary)'
        }}>
            <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
                        <div className="brand-logo-icon" style={{ width: 42, height: 42 }}>
                            <Sparkles size={22} />
                        </div>
                    </div>
                    <h2 className="text-h2" style={{ fontSize: '1.65rem' }}>Reset Password</h2>
                    <p className="text-body text-sm" style={{ marginTop: '4px' }}>
                        Enter your email to receive recovery instructions.
                    </p>
                </div>

                {submitted ? (
                    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem auto',
                            color: 'var(--success)'
                        }}>
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check Your Email</h3>
                        <p className="text-body text-sm" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            We have sent password reset instructions to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Be sure to check your Spam or Promotions folder if it doesn't appear shortly.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <Button
                                variant="secondary"
                                onClick={() => handleSendReset()}
                                disabled={cooldown > 0 || loading}
                                isLoading={loading}
                                leftIcon={<RotateCw size={14} className={loading ? 'animate-spin' : ''} />}
                                style={{ width: '100%' }}
                            >
                                {cooldown > 0 ? `Resend Link (${cooldown}s)` : 'Resend Link'}
                            </Button>

                            <Link to="/login" style={{ width: '100%' }}>
                                <Button variant="primary" style={{ width: '100%' }}>Return to Sign In</Button>
                            </Link>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                            <button
                                type="button"
                                onClick={() => setSubmitted(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Use a different email
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSendReset}>
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="student@university.edu"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            leftIcon={<Mail size={16} />}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            disabled={cooldown > 0 || loading}
                            style={{ width: '100%', marginTop: '1.25rem' }}
                        >
                            {cooldown > 0 ? `Wait (${cooldown}s)` : 'Send Reset Link'}
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <ArrowLeft size={16} /> Back to Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
