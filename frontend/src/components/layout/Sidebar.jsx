import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  LayoutDashboard, User, FileText, ScanSearch, Briefcase, Layers,
  Milestone, HelpCircle, Settings, LogOut, Sparkles, Terminal,
  ShieldAlert, Building2, CreditCard, ArrowRight, Mic, Trophy
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
    { to: '/roadmap', label: 'Career Roadmap', icon: <Milestone size={18} />, badge: 'Skills' },
    // { to: '/arena', label: 'Placement Arena', icon: <Trophy size={18} />, badge: '⚡ Live' },
    { to: '/simulations', label: 'Workplace Simulation', icon: <Terminal size={18} />, badge: 'Code IDE' },
    { to: '/interview-prep', label: 'Mock Interviews', icon: <HelpCircle size={18} />, badge: 'AI Voice' },
    { to: '/jobs', label: 'Jobs & Pipeline', icon: <Briefcase size={18} />, badge: 'Matches' },
    { to: '/pricing', label: 'Plans & Upgrades', icon: <CreditCard size={18} />, badge: '₹149' },
  ];

  return (<aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
    {/* Brand Header */}
    <div className="sidebar-brand">
      <div className="brand-logo-icon">
        <Sparkles size={20} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="brand-name">CareerOS</span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
          STUDENT & FRESHER SAAS
        </span>
      </div>
    </div>

    {/* 5 Core Navigation Items */}
    <nav className="sidebar-nav" style={{ padding: '0.5rem 0.25rem' }}>

      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onCloseMobile}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge && (
            <span className="badge badge-purple" style={{ padding: '0.12rem 0.45rem', fontSize: '0.6875rem' }}>
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}

      {/* Exclusive TPO Portal Navigation Link */}
      {(profile?.role === 'tpo' || profile?.role === 'college_admin' || user?.email?.toLowerCase().trim() === 'nikhil@gmail.com' || profile?.email?.toLowerCase().trim() === 'nikhil@gmail.com') && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <span className="nav-category-title" style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem' }}>
            🏛️ CAMPUS & PLACEMENTS
          </span>
          <NavLink
            to="/campus"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.12))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '8px',
              marginTop: '4px',
              color: '#f1f5f9'
            }}
          >
            <Building2 size={18} color="#818cf8" />
            <span style={{ flex: 1, fontWeight: 700 }}>Campus / TPO Portal</span>
            <span className="badge badge-purple" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>
              TPO
            </span>
          </NavLink>
        </div>
      )}

      {/* Exclusive Founder Access Link */}
      {(user?.email?.toLowerCase().trim() === 'nikhil@gmail.com' || profile?.email?.toLowerCase().trim() === 'nikhil@gmail.com') && (
        <div style={{ marginTop: '0.5rem' }}>
          <NavLink
            to="/admin"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.18), rgba(236, 72, 153, 0.12))',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          >
            <ShieldAlert size={18} color="#c084fc" />
            <span style={{ flex: 1, fontWeight: 700 }}>Founder Panel</span>
            <span className="badge" style={{ background: '#8b5cf6', color: '#fff', fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>
              ADMIN
            </span>
          </NavLink>
        </div>
      )}
    </nav>

    {/* Plan Quotas & Remaining Features Quick Card */}
    <div style={{
      margin: '0.5rem 0.75rem 0.35rem',
      padding: '0.65rem 0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.45rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc' }}>
          {currentPlan.badge}
        </span>
        <NavLink
          to="/pricing"
          onClick={onCloseMobile}
          style={{
            fontSize: '0.68rem',
            color: '#818cf8',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          <span>Upgrade</span>
          <ArrowRight size={10} />
        </NavLink>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem', color: '#94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🛠️ Tasks</span>
          <strong style={{ color: simsRemaining > 0 ? '#38bdf8' : '#ef4444' }}>
            {isVipBypass ? 'Unlimited' : `${simsRemaining} left`}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🎙️ Voice Rounds</span>
          <strong style={{ color: voiceRemaining > 0 ? '#a78bfa' : '#ef4444' }}>
            {isVipBypass ? 'Unlimited' : `${voiceRemaining} left`}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>📄 ATS Scans</span>
          <strong style={{ color: scansRemaining > 0 ? '#34d399' : '#ef4444' }}>
            {isVipBypass ? 'Unlimited' : `${scansRemaining} left`}
          </strong>
        </div>
      </div>
    </div>

    {/* Sidebar Footer User Info & Quick Action Icons */}
    <div className="sidebar-footer">
      <div className="user-profile-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 0.75rem' }}>
        <NavLink
          to="/profile"
          onClick={onCloseMobile}
          title="View Career Profile & Skills"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}
        >
          <img
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt="User Avatar"
            className="user-avatar"
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className="user-info-text" style={{ minWidth: 0 }}>
            <div className="user-name" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Alex Rivera'}
            </div>
            <div className="user-email" style={{ fontSize: '0.6875rem', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Profile & Skills →
            </div>
          </div>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <NavLink
            to="/settings"
            onClick={onCloseMobile}
            title="Settings"
            className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <Settings size={16} />
          </NavLink>
          <button
            onClick={handleLogout}
            title="Logout"
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  </aside>);
};
