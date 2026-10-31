import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Cpu,
  CreditCard,
  Gauge,
  Activity,
  ShieldAlert,
  Sliders,
  LogOut,
  Layers
} from 'lucide-react';
import { authService, FounderProfile } from '../../services/authService';

interface AdminSidebarProps {
  founder: FounderProfile | null;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ founder }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/users', label: 'User Directory', icon: Users },
    { to: '/ai-analytics', label: 'AI Cost Center', icon: Cpu },
    { to: '/revenue', label: 'Revenue & Payments', icon: CreditCard },
    { to: '/quotas', label: 'Quota Monitoring', icon: Gauge },
    { to: '/health', label: 'System Health', icon: Activity },
    { to: '/audit-logs', label: 'Security & Audit', icon: ShieldAlert },
    { to: '/settings', label: 'Platform Settings', icon: Sliders }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0
          }}
        >
          <Layers size={22} />
        </div>
        <div className="sidebar-text">
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#fff' }}>
            Career<span style={{ color: 'var(--primary)' }}>OS</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            FOUNDER CONSOLE
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-subtle)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div
        style={{
          padding: '16px 18px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}
      >
        <div style={{ overflow: 'hidden' }} className="sidebar-text">
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {founder?.email || 'Founder'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {founder?.role || 'Founder'}
            </span>
          </div>
        </div>

        <button
          onClick={() => authService.logout()}
          title="Sign Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

