import React from 'react';
import { Menu, Sparkles, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
export const Navbar = ({ onOpenMobileSidebar, onToggleCopilot }) => {
  const { isSupabaseConnected, profile } = useAuth();
  const [theme, setTheme] = React.useState('dark');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };
  return (<header className="top-navbar">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button onClick={onOpenMobileSidebar} className="btn-ghost" style={{ display: 'none', padding: '6px' }} id="mobile-menu-toggle">
        <Menu size={20} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Target:
        </span>
        <span className="badge badge-primary" style={{ padding: '0.25rem 0.65rem' }}>
          {profile?.target_role || 'Java Backend Developer'}
        </span>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {onToggleCopilot && (<button onClick={onToggleCopilot} className="btn-ghost" style={{
        padding: '0.4rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(124, 58, 237, 0.12)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        color: 'var(--primary)',
        fontSize: '0.8125rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        cursor: 'pointer'
      }}>
        <Sparkles size={14} /> AI Copilot
      </button>)}

      {isSupabaseConnected && (<span className="badge badge-success">
        <ShieldCheck size={13} /> Supabase Live
      </span>)}


      <button onClick={toggleTheme} className="btn-ghost" style={{ padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }} title="Toggle Theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>

    <style>{`
        @media (max-width: 768px) {
          #mobile-menu-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
  </header>);
};
