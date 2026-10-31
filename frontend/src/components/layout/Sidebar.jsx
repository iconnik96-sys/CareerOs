import { isCampusAdmin } from '../../utils/founderAuth';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  LayoutDashboard, User, FileText, ScanSearch, Briefcase, Layers,
  HelpCircle, Settings, LogOut, Sparkles, Terminal,
  Building2, CreditCard, ArrowRight, Mic, Trophy
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, profile, logout } = useAuth();
  const { currentPlan, activePlanId, usage, totalVoiceInterviewsAllowed, isVipBypass } = useSubscription();
  const navigate = useNavigate();

  const simsUsed = usage?.simulations_completed?.length || 0;
  const simsTotal = currentPlan.simulations_allowed || 1;
  const simsRemaining = isVipBypass ? '∞' : Math.max(0, simsTotal - simsUsed);

  const voiceUsed = usage?.voice_interviews_count || 0;
  const voiceTotal = totalVoiceInterviewsAllowed || 1;
  const voiceRemaining = isVipBypass ? '∞' : Math.max(0, voiceTotal - voiceUsed);

  const scansUsed = usage?.resume_scans_count || 0;
  const scansTotal = currentPlan.resume_scans_allowed || 1;
  const scansRemaining = isVipBypass ? '∞' : Math.max(0, scansTotal - scansUsed);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/ai-studio', label: 'AI Career Studio', icon: <Sparkles size={18} />, badge: 'ATS 85' },
    // { to: '/arena', label: 'Placement Arena', icon: <Trophy size={18} />, badge: '⚡ Live' },
    { to: '/simulations', label: 'Workplace Simulation', icon: <Terminal size={18} />, badge: 'Code IDE' },
    { to: '/interview-prep', label: 'Mock Interviews', icon: <HelpCircle size={18} />, badge: 'AI Voice' },
    { to: '/jobs', label: 'Jobs & Pipeline', icon: <Briefcase size={18} />, badge: 'Matches' },
    { to: '/pricing', label: 'Plans & Upgrades', icon: <CreditCard size={18} />, badge: '₹149' },
  ];

  return (<aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
    {/* Brand Header */}
    <div
      style={{
        padding: '20px',
        minHeight: '86px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxSizing: 'border-box'
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
        <Sparkles size={20} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#fff' }}>
          Career<span style={{ color: 'var(--primary)' }}>OS</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
          STUDENT PORTAL
        </div>
      </div>
    </div>

    {/* Core Navigation Items */}
    <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onCloseMobile}
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
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge && (
            <span className="badge badge-purple" style={{ padding: '2px 8px', fontSize: '0.6875rem' }}>
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}

      {/* Exclusive TPO Portal Navigation Link */}
      {isCampusAdmin(user, profile) && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <span className="nav-category-title" style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem' }}>
            🏛️ CAMPUS & PLACEMENTS
          </span>
          <NavLink
            to="/campus"
            onClick={onCloseMobile}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'var(--primary-subtle)' : 'linear-gradient(90deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.12))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              marginTop: '4px',
              color: '#f1f5f9',
              fontWeight: 600,
              fontSize: '0.86rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            })}
          >
            <Building2 size={18} color="#818cf8" />
            <span style={{ flex: 1 }}>Campus / TPO</span>
            <span className="badge badge-purple" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
              TPO
            </span>
          </NavLink>
        </div>
      )}

    </nav>

    {/* Plan Quotas & Remaining Features Quick Card */}
    <div style={{
      margin: '12px 12px 8px',
      padding: '12px 14px',
      backgroundColor: 'var(--bg-card-subtle)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
          {currentPlan.badge}
        </span>
        <NavLink
          to="/pricing"
          onClick={onCloseMobile}
          style={{
            fontSize: '0.72rem',
            color: 'var(--primary)',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <span>Upgrade</span>
          <ArrowRight size={10} />
        </NavLink>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🛠️ Tasks</span>
          <strong style={{ color: simsRemaining > 0 ? '#38bdf8' : '#ef4444', fontFamily: 'var(--font-mono, monospace)' }}>
            {isVipBypass ? 'Unlimited' : `${simsRemaining} left`}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🎙️ Voice Mock</span>
          <strong style={{ color: voiceRemaining > 0 ? '#a78bfa' : '#ef4444', fontFamily: 'var(--font-mono, monospace)' }}>
            {isVipBypass ? 'Unlimited' : `${voiceRemaining} left`}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>📄 ATS Scans</span>
          <strong style={{ color: scansRemaining > 0 ? '#34d399' : '#ef4444', fontFamily: 'var(--font-mono, monospace)' }}>
            {isVipBypass ? 'Unlimited' : `${scansRemaining} left`}
          </strong>
        </div>
      </div>
    </div>

    {/* Sidebar Footer User Info & Quick Action Icons */}
    <div className="sidebar-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NavLink
          to="/profile"
          onClick={onCloseMobile}
          title="View Career Profile & Skills"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
        >
          <img
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt="User Avatar"
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Student Profile'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Skills & Targets →
            </div>
          </div>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink
            to="/settings"
            onClick={onCloseMobile}
            title="Settings"
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', color: 'var(--text-muted)' }}
          >
            <Settings size={15} />
          </NavLink>
          <button
            onClick={handleLogout}
            title="Logout"
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', color: 'var(--text-muted)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  </aside>);
};
