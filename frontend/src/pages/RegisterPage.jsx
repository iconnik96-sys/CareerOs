import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, loginWithGoogle } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fullName || !email || !password) {
            showToast('Please fill out all required fields', 'warning');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password should be at least 6 characters long', 'warning');
            return;
        }
        setLoading(true);
        const { error } = await signup(email, password, fullName);
        setLoading(false);
        if (error) {
            showToast(error, 'error', 'Registration Failed');
        }
        else {
            showToast('Account created successfully! Let\'s setup your career profile.', 'success', 'Welcome');
            navigate('/onboarding');
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
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2.25rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <div className="brand-logo-icon" style={{ width: 42, height: 42 }}>
              <Sparkles size={22}/>
            </div>
          </div>
          <h2 className="text-h2" style={{ fontSize: '1.65rem' }}>Create Free Account</h2>
          <p className="text-body text-sm" style={{ marginTop: '4px' }}>
            Personalized roadmaps and job tracking for freshers.
          </p>
        </div>

        <Button variant="secondary" onClick={() => loginWithGoogle()} style={{ width: '100%', marginBottom: '1.25rem' }} leftIcon={<svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>}>
          Sign Up with Google
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}/>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or with details
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}/>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <Input label="Full Name" placeholder="Alex Rivera" value={fullName} onChange={e => setFullName(e.target.value)} leftIcon={<User size={16}/>} autoComplete="off" autoCorrect="off" autoCapitalize="words" spellCheck="false" required/>

          <Input label="Email Address" type="email" placeholder="alex.rivera@university.edu" value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail size={16}/>} autoComplete="off" autoCorrect="off" spellCheck="false" required/>

          <Input label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} leftIcon={<Lock size={16}/>} autoComplete="new-password" required/>

          <Input label="Confirm Password" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} leftIcon={<Lock size={16}/>} autoComplete="new-password" required/>

          <Button type="submit" variant="primary" isLoading={loading} style={{ width: '100%', marginTop: '1.25rem' }}>
            Create Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>);
};
