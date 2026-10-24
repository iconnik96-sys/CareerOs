import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { campusService } from '../services/campusService';
import { Building2, Sparkles, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const AcceptCampusInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login, signup } = useAuth();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invite token was provided in the URL. Please check your invitation email.');
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        setLoading(true);
        const data = await campusService.verifyInviteToken(token);
        setInviteData(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Activate invite token on backend
      const res = await campusService.acceptInvite({
        token,
        password,
        full_name: inviteData?.full_name
      });

      // 2. Sign up or log in through Supabase Auth
      const email = inviteData?.email;
      if (email && signup) {
        const signupRes = await signup(email, password, inviteData?.full_name);
        if (signupRes?.error) {
          // If already registered in auth, attempt sign-in
          await login(email, password);
        }
      }

      setSuccess(true);
      showToast('TPO Account activated successfully! Welcome to CareerOS.', 'success');

      // 3. Navigate to campus dashboard
      setTimeout(() => {
        navigate('/campus');
      }, 1200);
    } catch (err) {
      showToast(err.message || 'Failed to activate account', 'error');
    } finally {
      setSubmitting(false);
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
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', position: 'relative' }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
          }}>
            <Building2 size={28} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Campus Placement Portal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Official Training & Placement Officer (TPO) Onboarding
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', width: 32, height: 32 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Verifying institutional invitation token...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={32} color="#f87171" style={{ margin: '0 auto 0.5rem auto' }} />
            <h4 style={{ color: '#fca5a5', margin: '0 0 6px 0', fontSize: '1rem' }}>Invitation Error</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={36} color="#4ade80" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ color: '#86efac', margin: '0 0 6px 0' }}>Account Activated!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Redirecting you to the Campus Placement Dashboard...
            </p>
          </div>
        )}

        {/* Valid Invite Form */}
        {!loading && !error && !success && inviteData && (
          <div>
            {/* Institution Invitation Info Box */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '1.2rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Invited Institution
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                {inviteData.college_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#818cf8', marginTop: '4px' }}>
                Officer: <strong>{inviteData.full_name}</strong> ({inviteData.email})
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  Create TPO Account Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input"
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
              >
                {submitting ? 'Activating Account...' : 'Activate Placement Officer Account'}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
export default AcceptCampusInvitePage;
