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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onOpenMobileSidebar} className="btn-ghost" style={{ display: 'none', padding: '6px' }} id="mobile-menu-toggle">
          <Menu size={20}/>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Remaining Features & Plan Quota Tracker Capsule (Top Navigation) */}
        <div style={{ position: 'relative' }} ref={quotaMenuRef}>
            <button
                type="button"
                onClick={() => setQuotaMenuOpen(prev => !prev)}
                className="btn-ghost"
                style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: activePlanId === 'pro'
                        ? 'rgba(236, 72, 153, 0.12)'
                        : activePlanId === 'premium'
                        ? 'rgba(99, 102, 241, 0.12)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: activePlanId === 'pro'
                        ? '1px solid rgba(236, 72, 153, 0.35)'
                        : activePlanId === 'premium'
                        ? '1px solid rgba(99, 102, 241, 0.35)'
                        : '1px solid var(--border-color)',
                    color: activePlanId === 'pro' ? '#f472b6' : activePlanId === 'premium' ? '#818cf8' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                }}
                title="View Remaining Features & Quotas in your Plan"
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {activePlanId === 'pro' && <Crown size={13} color="#f472b6" />}
                    {activePlanId === 'premium' && <Zap size={13} color="#818cf8" />}
                    <span>{currentPlan.badge || '🟢 Free'}</span>
                </span>
                
                <span style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

                {/* Remaining counters summary pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#cbd5e1' }}>
                    <span title={`${simsRemaining} Simulation Tasks remaining`}>
                        🛠️ <strong style={{ color: simsRemaining > 0 ? '#38bdf8' : '#ef4444' }}>{simsRemaining}</strong> left
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span title={`${voiceRemaining} Voice Mock Interviews remaining`}>
                        🎙️ <strong style={{ color: voiceRemaining > 0 ? '#a78bfa' : '#ef4444' }}>{voiceRemaining}</strong> left
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span title={`${scansRemaining} ATS Resume Scans remaining`}>
                        📄 <strong style={{ color: scansRemaining > 0 ? '#34d399' : '#ef4444' }}>{scansRemaining}</strong> left
                    </span>
                </div>

                <ChevronDown size={13} style={{ transform: quotaMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.7 }} />
            </button>

            {/* Floating Rich Glassmorphism Quota & Remaining Features Dropdown */}
            {quotaMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '340px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(99, 102, 241, 0.15)',
                    padding: '1rem',
                    zIndex: 5000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    backdropFilter: 'blur(16px)'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                                Active Plan
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {currentPlan.badge}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setQuotaMenuOpen(false);
                                navigate('/pricing');
                            }}
                            style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                        >
                            <span>Upgrade</span>
                            <ArrowRight size={12} />
                        </button>
                    </div>

                    {/* Remaining Features Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Remaining Features in Your Plan
                        </div>

                        {/* Feature 1: Simulation Tasks */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Terminal size={14} color="#38bdf8" /> Simulation Tasks
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                                    {isVipBypass ? 'Unlimited' : `${simsRemaining} left of ${simsTotal}`}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: isVipBypass ? '100%' : `${Math.min(100, (simsUsed / simsTotal) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: '#38bdf8',
                                    borderRadius: '999px'
                                }} />
                            </div>
                        </div>

                        {/* Feature 2: AI Voice Mock Interviews */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Mic size={14} color="#a78bfa" /> Voice Mock Rounds
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a78bfa' }}>
                                    {isVipBypass ? 'Unlimited' : `${voiceRemaining} left of ${voiceTotal}`}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: isVipBypass ? '100%' : `${Math.min(100, (voiceUsed / voiceTotal) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: '#a78bfa',
                                    borderRadius: '999px'
                                }} />
                            </div>
                            {referral?.bonusInterviews > 0 && (
                                <div style={{ fontSize: '0.65rem', color: '#c084fc', marginTop: '0.25rem' }}>
                                    🎁 Includes +{referral.bonusInterviews} earned from friend referrals!
                                </div>
                            )}
                        </div>

                        {/* Feature 3: ATS Resume Scans */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <FileText size={14} color="#34d399" /> ATS Resume Scans
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399' }}>
                                    {isVipBypass ? 'Unlimited' : `${scansRemaining} left of ${scansTotal}`}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: isVipBypass ? '100%' : `${Math.min(100, (scansUsed / scansTotal) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: '#34d399',
                                    borderRadius: '999px'
                                }} />
                            </div>
                        </div>

                        {/* Feature 4: Tailored Cover Letters */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Mail size={14} color="#f59e0b" /> Tailored Cover Letters
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: clTotal > 0 ? '#f59e0b' : '#94a3b8' }}>
                                    {isVipBypass ? 'Unlimited' : (clTotal > 0 ? `${clRemaining} left of ${clTotal}` : 'Locked in Free')}
                                </span>
                            </div>
                            {clTotal > 0 ? (
                                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: isVipBypass ? '100%' : `${Math.min(100, (clUsed / clTotal) * 100)}%`,
                                        height: '100%',
                                        backgroundColor: '#f59e0b',
                                        borderRadius: '999px'
                                    }} />
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                    Available on Student Premium (10) and Placement Pro (30)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pro Perks Status Mini Pills */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: currentPlan.guided_autofill ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: currentPlan.guided_autofill ? '#34d399' : '#64748b' }}>
                            {currentPlan.guided_autofill ? '✓ Auto-Apply Fix' : '🔒 Auto-Apply Fix'}
                        </span>
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: currentPlan.pro_ide_mentor ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: currentPlan.pro_ide_mentor ? '#60a5fa' : '#64748b' }}>
                            {currentPlan.pro_ide_mentor ? '✓ Pro IDE & Marcus AI' : '🔒 Pro IDE'}
                        </span>
                    </div>

                    {/* Quick Referral Bonus CTA */}
                    <div
                        onClick={() => {
                            setQuotaMenuOpen(false);
                            setIsReferralModalOpen(true);
                        }}
                        style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Gift size={14} color="#c084fc" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>Refer Friends & Earn +2 Voice Rounds</span>
                        </div>
                        <ChevronRight size={13} color="#c084fc" />
                    </div>
                </div>
            )}
        </div>

        {/* Referral Program Button */}
        <button
            onClick={() => setIsReferralModalOpen(true)}
            className="btn-ghost"
            style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#c084fc',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
            }}
            title="Invite friends & get +2 Free Voice Mock Interviews"
        >
            <Gift size={14} color="#c084fc" />
            <span>Refer (+2 Free)</span>
        </button>

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
        @media (max-width: 768px) {
          #mobile-menu-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>);
};
