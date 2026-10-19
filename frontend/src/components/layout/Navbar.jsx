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
          <Menu size={20}/>
        </button>
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
            <Sparkles size={14}/> AI Copilot
          </button>)}

        {isSupabaseConnected && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)'
            }}
            title="Database Connected (Supabase Live)"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            Connected
          </span>
        )}


        <button onClick={toggleTheme} className="btn-ghost" style={{ padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
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
