import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { resetPassword } = useAuth();
    const { showToast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            showToast('Please enter your email address', 'warning');
            return;
        }
        setLoading(true);
        const { error } = await resetPassword(email);
        setLoading(false);
        if (error) {
            showToast(error, 'error', 'Reset Failed');
        }
        else {
            setSubmitted(true);
            showToast('Password reset link has been dispatched to your email.', 'success', 'Link Sent');
        }
    };
    return (<div style={{
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
              <Sparkles size={22}/>
            </div>
          </div>
          <h2 className="text-h2" style={{ fontSize: '1.65rem' }}>Reset Password</h2>
          <p className="text-body text-sm" style={{ marginTop: '4px' }}>
            Enter your email to receive recovery instructions.
          </p>
        </div>

        {submitted ? (<div style={{ textAlign: 'center', padding: '1rem 0' }}>
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
              <CheckCircle2 size={32}/>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check Your Email</h3>
            <p className="text-body text-sm" style={{ marginBottom: '1.5rem' }}>
              We have sent password reset instructions to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            </p>
            <Link to="/login">
              <Button variant="primary" style={{ width: '100%' }}>Return to Sign In</Button>
            </Link>
          </div>) : (<form onSubmit={handleSubmit}>
            <Input label="Email Address" type="email" placeholder="student@university.edu" value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail size={16}/>} required/>

            <Button type="submit" variant="primary" isLoading={loading} style={{ width: '100%', marginTop: '1.25rem' }}>
              Send Reset Link
            </Button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <ArrowLeft size={16}/> Back to Sign In
              </Link>
            </div>
          </form>)}
      </div>
    </div>);
};
