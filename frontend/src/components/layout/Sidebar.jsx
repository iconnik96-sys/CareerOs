import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, User, FileText, ScanSearch, Briefcase, Layers, Milestone, HelpCircle, Settings, LogOut, Sparkles } from 'lucide-react';
export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => {
        await logout();
        navigate('/');
    };
    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
        { to: '/profile', label: 'Career Profile', icon: <User size={18}/> },
        { to: '/ai-studio', label: 'AI Career Studio', icon: <Sparkles size={18}/>, badge: 'FastAPI' },
        { to: '/resume', label: 'Resume', icon: <FileText size={18}/> },
        { to: '/job-analyzer', label: 'Job Analyzer', icon: <ScanSearch size={18}/>, badge: 'AI' },
        { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18}/> },
        { to: '/applications', label: 'Applications', icon: <Layers size={18}/> },
        { to: '/roadmap', label: 'Career Roadmap', icon: <Milestone size={18}/> },
        { to: '/interview-prep', label: 'Interview Prep', icon: <HelpCircle size={18}/>, badge: 'AI Live' },
        { to: '/settings', label: 'Settings', icon: <Settings size={18}/> },
    ];
    return (<aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <Sparkles size={20}/>
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
        {navItems.map(item => (<NavLink key={item.to} to={item.to} onClick={onCloseMobile} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (<span className="badge badge-purple" style={{ padding: '0.1rem 0.4rem', fontSize: '0.6875rem' }}>
                {item.badge}
              </span>)}
          </NavLink>))}
      </nav>

      {/* Sidebar Footer User Info & Logout */}
      <div className="sidebar-footer">
        <div className="user-profile-card">
          <img src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="User Avatar" className="user-avatar"/>
          <div className="user-info-text">
            <div className="user-name">{profile?.full_name || 'Alex Rivera'}</div>
            <div className="user-email">{profile?.email || user?.email || 'alex.rivera@university.edu'}</div>
          </div>
          <button onClick={handleLogout} title="Logout" className="btn-ghost" style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
            <LogOut size={16}/>
          </button>
        </div>
      </div>
    </aside>);
};
