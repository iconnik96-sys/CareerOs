import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, Lock, Mail, AlertTriangle } from 'lucide-react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'supabase' | 'key'>('supabase');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (authMode === 'supabase') {
        if (!email.trim() || !password) {
          throw new Error('Please provide founder email and password.');
        }
        await authService.loginWithSupabase(email, password);
      } else {
        if (!adminKey.trim()) {
          throw new Error('Please enter the Master Admin API Key.');
        }
        await authService.loginWithAdminKey(adminKey);
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'var(--bg-app)'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: 16
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Career<span style={{ color: 'var(--primary)' }}>OS</span> Founder Console
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Authoritative Operations & Financial Control
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            backgroundColor: 'var(--bg-input)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => { setAuthMode('supabase'); setErrorMsg(null); }}
            style={{
              background: authMode === 'supabase' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: 'none',
              color: authMode === 'supabase' ? '#fff' : 'var(--text-muted)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Mail size={14} />
            <span>Founder Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('key'); setErrorMsg(null); }}
            style={{
              background: authMode === 'key' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: 'none',
              color: authMode === 'key' ? '#fff' : 'var(--text-muted)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Key size={14} />
            <span>Admin Key</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: 20
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {authMode === 'supabase' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Founder Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="founder@careeros.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Master Admin Secret Key
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="Enter ADMIN_API_KEY..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="input font-mono"
                  style={{ paddingLeft: 38 }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Direct cryptographic bypass configured via <code style={{ color: 'var(--primary)' }}>ADMIN_API_KEY</code>.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, padding: '11px 16px' }}
          >
            {isLoading ? 'Verifying Authorization...' : 'Access Founder Console'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Restricted system. Access attempts are recorded in the security audit ledger.
        </div>
      </div>
    </div>
  );
};

