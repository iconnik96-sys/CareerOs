import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Sparkles, ShieldCheck, Palette, Check, Gift, Crown, Zap,
  ChevronDown, Terminal, Mic, FileText, ArrowRight, Lock, CheckCircle2, ChevronRight, Layers, Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

export const Navbar = ({ onOpenMobileSidebar, onToggleCopilot }) => {
    const navigate = useNavigate();
    const { isSupabaseConnected, profile } = useAuth();
    const {
        currentPlan,
        activePlanId,
        isVipBypass,
        setIsReferralModalOpen,
        usage,
        referral,
        totalVoiceInterviewsAllowed
    } = useSubscription();

    const { theme, setTheme, themes } = useTheme();
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const themeMenuRef = useRef(null);
    const [quotaMenuOpen, setQuotaMenuOpen] = useState(false);
    const quotaMenuRef = useRef(null);

    // Compute live remaining quotas for all core features
    const simsUsed = usage?.simulations_completed?.length || 0;
    const simsTotal = currentPlan.simulations_allowed || 1;
    const simsRemaining = isVipBypass ? '∞' : Math.max(0, simsTotal - simsUsed);

    const voiceUsed = usage?.voice_interviews_count || 0;
    const voiceTotal = totalVoiceInterviewsAllowed || 1;
    const voiceRemaining = isVipBypass ? '∞' : Math.max(0, voiceTotal - voiceUsed);

    const scansUsed = usage?.resume_scans_count || 0;
    const scansTotal = currentPlan.resume_scans_allowed || 1;
    const scansRemaining = isVipBypass ? '∞' : Math.max(0, scansTotal - scansUsed);

    const clUsed = usage?.cover_letters_count || 0;
    const clTotal = currentPlan.cover_letters_allowed || 0;
    const clRemaining = isVipBypass ? '∞' : Math.max(0, clTotal - clUsed);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
                setThemeMenuOpen(false);
            }
            if (quotaMenuRef.current && !quotaMenuRef.current.contains(e.target)) {
                setQuotaMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeThemeObj = themes.find(t => t.id === theme) || themes[0];

    return (<header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onOpenMobileSidebar} className="btn-ghost" style={{ padding: '6px' }} id="mobile-menu-toggle" aria-label="Toggle navigation menu">
          <Menu size={20}/>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>




        {/* Referral Program Button */}
        <button
            onClick={() => setIsReferralModalOpen(true)}
            className="btn-ghost"
            style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#c084fc',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
            }}
            title="Invite friends & get +2 Free Voice Mock Interviews"
        >
            <Gift size={14} color="#c084fc" />
            <span className="hide-on-mobile">Refer (+2 Free)</span>
            <span className="show-on-mobile">+2 Free</span>
        </button>

        {onToggleCopilot && (<button onClick={onToggleCopilot} className="btn-ghost" style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
            }}>
            <Sparkles size={14}/>
            <span className="hide-on-mobile">AI Copilot</span>
          </button>)}

        {isSupabaseConnected && (
          <span
            className="hide-on-mobile"
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

        {/* Theme Switcher Popover */}
        <div style={{ position: 'relative' }} ref={themeMenuRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="btn-ghost"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
            title="Change Visual Theme"
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: activeThemeObj.primary, boxShadow: `0 0 6px ${activeThemeObj.primary}` }} />
            <Palette size={15} />
            <span style={{ display: 'none' }} className="theme-label-desktop">{activeThemeObj.name.split(' ')[0]}</span>
          </button>

          {themeMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: 220,
                backgroundColor: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '4px 8px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Color Theme
              </div>
              {themes.map(t => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setThemeMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                      border: isSelected ? `1px solid ${t.primary}` : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: t.primary, boxShadow: `0 0 6px ${t.primary}` }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t.tagline.split(' ')[0]}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: t.primary }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
    </header>);
};
