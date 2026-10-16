import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, User, FileText, ScanSearch, Briefcase, Layers,
  Milestone, HelpCircle, Settings, LogOut, Sparkles, Terminal,
  ChevronDown, ChevronRight, Mic, Keyboard, ShieldAlert
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isInterviewPrepActive = location.pathname.startsWith('/interview-prep');
  const searchParams = new URLSearchParams(location.search);
  const activePrepMode = searchParams.get('mode') || 'voice';

  const [interviewDropdownOpen, setInterviewDropdownOpen] = useState(isInterviewPrepActive);

  useEffect(() => {
    if (isInterviewPrepActive) {
      setInterviewDropdownOpen(true);
    }
  }, [isInterviewPrepActive]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/profile', label: 'Career Profile', icon: <User size={18} /> },
    { to: '/ai-studio', label: 'AI Career Studio', icon: <Sparkles size={18} />, badge: 'FastAPI' },
    { to: '/resume', label: 'Resume', icon: <FileText size={18} /> },
    { to: '/job-analyzer', label: 'Job Analyzer', icon: <ScanSearch size={18} />, badge: 'AI' },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/applications', label: 'Applications', icon: <Layers size={18} /> },
    { to: '/roadmap', label: 'Career Roadmap', icon: <Milestone size={18} /> },
    {
      to: '/interview-prep',
      label: 'Interview Prep',
      icon: <HelpCircle size={18} />,
      badge: 'AI Live',
      hasDropdown: true
    },
    { to: '/simulations', label: 'Workplace Simulation', icon: <Terminal size={18} />, badge: 'Practice' },
    { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
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

    {/* Navigation List */}
    <nav className="sidebar-nav">
      <span className="nav-category-title">Platform</span>
      {navItems.map(item => {
        if (item.hasDropdown) {
          return (
            <div key={item.to} style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                type="button"
                onClick={() => {
                  const nextState = !interviewDropdownOpen;
                  setInterviewDropdownOpen(nextState);
                  if (!isInterviewPrepActive) {
                    navigate('/interview-prep?mode=voice');
                    if (onCloseMobile) onCloseMobile();
                  }
                }}
                className={`nav-item ${isInterviewPrepActive ? 'active' : ''}`}
                style={{
                  width: '100%',
                  background: isInterviewPrepActive ? 'var(--primary-light)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span className="badge badge-purple" style={{ padding: '0.1rem 0.4rem', fontSize: '0.6875rem', marginRight: '2px' }}>
                    {item.badge}
                  </span>
                )}
                {interviewDropdownOpen ? (
                  <ChevronDown size={14} style={{ color: isInterviewPrepActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                ) : (
                  <ChevronRight size={14} style={{ color: isInterviewPrepActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                )}
              </button>

              {/* Submenu Dropdown */}
              {interviewDropdownOpen && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  marginLeft: '1.25rem',
                  paddingLeft: '0.65rem',
                  borderLeft: '2px solid rgba(99, 102, 241, 0.25)',
                  marginTop: '4px',
                  marginBottom: '6px'
                }}>
                  <NavLink
                    to="/interview-prep?mode=voice"
                    onClick={onCloseMobile}
                    className={`nav-subitem ${isInterviewPrepActive && activePrepMode === 'voice' ? 'active' : ''}`}
                  >
                    <Mic size={14} className="text-primary-accent" />
                    <span style={{ flex: 1 }}>Live Voice Interview</span>
                    <span className="badge badge-purple" style={{ padding: '0.05rem 0.35rem', fontSize: '0.625rem' }}>
                      Live Audio
                    </span>
                  </NavLink>

                  <NavLink
                    to="/interview-prep?mode=text"
                    onClick={onCloseMobile}
                    className={`nav-subitem ${isInterviewPrepActive && activePrepMode === 'text' ? 'active' : ''}`}
                  >
                    <Keyboard size={14} className="text-info" />
                    <span style={{ flex: 1 }}>Typing & Text Interview</span>
                    <span className="badge badge-neutral" style={{ padding: '0.05rem 0.35rem', fontSize: '0.625rem' }}>
                      Self-Paced
                    </span>
                  </NavLink>
                </div>
              )}
            </div>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span className="badge badge-purple" style={{ padding: '0.1rem 0.4rem', fontSize: '0.6875rem' }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}

      {/* Exclusive Founder Access Link */}
      {(user?.email?.toLowerCase().trim() === 'nikhil@gmail.com' || profile?.email?.toLowerCase().trim() === 'nikhil@gmail.com') && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(139, 92, 246, 0.25)' }}>
          <span className="nav-category-title" style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem' }}>
            👑 FOUNDER ONLY
          </span>
          <NavLink
            to="/admin"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.18), rgba(236, 72, 153, 0.12))',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '8px',
              marginTop: '4px',
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

    {/* Sidebar Footer User Info & Logout */}
    <div className="sidebar-footer">
      <div className="user-profile-card">
        <img src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="User Avatar" className="user-avatar" />
        <div className="user-info-text">
          <div className="user-name">{profile?.full_name || 'Alex Rivera'}</div>
          <div className="user-email">{profile?.email || user?.email || 'alex.rivera@university.edu'}</div>
        </div>
        <button onClick={handleLogout} title="Logout" className="btn-ghost" style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  </aside>);
};
