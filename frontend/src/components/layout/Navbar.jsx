import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Sparkles, Gift
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useHeader } from '../../contexts/HeaderContext';

export const Navbar = ({ onOpenMobileSidebar, onToggleCopilot }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuth();
    const { headerConfig } = useHeader();
    const {
        setIsReferralModalOpen
    } = useSubscription();

    // Smart fallback title and subtitle based on current route
    const getFallbackHeader = () => {
        const path = location.pathname;
        const firstName = profile?.full_name?.split(' ')[0] || 'Student';
        const targetRole = profile?.target_role || 'Backend Developer';

        if (path === '/dashboard') {
            return {
                title: `Good morning, ${firstName} 👋`,
                subtitle: `Here is your verified readiness and daily mission for ${targetRole}.`
            };
        }
        if (path.startsWith('/ai-studio') || path.startsWith('/ai-career-studio')) {
            return {
                title: 'AI Career Studio',
                subtitle: 'Build Overleaf-grade LaTeX resumes with live preview and tailored outreach.'
            };
        }
        if (path.startsWith('/interview-prep')) {
            return {
                title: `${targetRole} Technical Interview Prep`,
                subtitle: 'Curated questions stored in database with real-time STAR AI answer evaluation.'
            };
        }
        if (path === '/jobs') {
            return {
                title: 'Jobs & Hiring Pipeline',
                subtitle: 'Explore curated fresher opportunities matched with your verified skills.'
            };
        }
        if (path.startsWith('/jobs/')) {
            return {
                title: 'Job Details & Fit Analysis',
                subtitle: 'Detailed role specifications, requirements, and skill matching.'
            };
        }
        if (path === '/applications') {
            return {
                title: 'Jobs & Hiring Pipeline',
                subtitle: 'Manage and monitor your job hiring funnel across all application stages.'
            };
        }
        if (path.startsWith('/simulations')) {
            return {
                title: 'Workplace Simulation Lab',
                subtitle: 'Interactive production engineering tickets & pull request simulations.'
            };
        }
        if (path === '/profile') {
            return {
                title: 'Career Profile',
                subtitle: 'Personal bio, target parameters, verified skills, and project portfolio.'
            };
        }
        if (path === '/pricing') {
            return {
                title: 'Plans & Upgrades',
                subtitle: 'CareerOS Pro & Ultimate subscription plans for engineering students.'
            };
        }
        if (path === '/settings') {
            return {
                title: 'Platform Settings',
                subtitle: 'Configure your credentials, notifications, and platform preferences.'
            };
        }
        if (path.startsWith('/campus') || path === '/tpo') {
            return {
                title: 'Campus Placement Portal',
                subtitle: 'Placement cohort monitoring, verified skills matrix, and company hiring drives.'
            };
        }
        return {
            title: 'CareerOS',
            subtitle: 'AI-Powered Student Career Acceleration Platform'
        };
    };

    const fallback = getFallbackHeader();
    const displayTitle = headerConfig.title || fallback.title;
    const displaySubtitle = headerConfig.subtitle || fallback.subtitle;
    const headerActions = headerConfig.actions;

    return (
      <header className="top-navbar">
        {/* Left: Mobile Toggle + Page Title & Subtitle (Matching AdminHeader) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onOpenMobileSidebar}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-md)' }}
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} color="var(--text-primary)" />
          </button>

          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.25 }}>
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Page Actions & Global Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Custom Page Actions */}
          {headerActions}

          {/* Referral Program Button */}
          <button
            onClick={() => setIsReferralModalOpen(true)}
            className="badge badge-purple"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
            title="Invite friends & get +2 Free Voice Mock Interviews"
          >
            <Gift size={14} color="#c084fc" />
            <span className="hide-on-mobile">Refer (+2 Free)</span>
            <span className="show-on-mobile">+2 Free</span>
          </button>

          {onToggleCopilot && (
            <button
              onClick={onToggleCopilot}
              className="badge badge-primary"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--primary)' }} />
              <span className="hide-on-mobile">AI Copilot</span>
            </button>
          )}

        </div>

        <style>{`
          #mobile-menu-toggle {
            display: none;
          }
          @media (max-width: 1024px) {
            #mobile-menu-toggle {
              display: inline-flex !important;
            }
          }
        `}</style>
      </header>
    );
};
