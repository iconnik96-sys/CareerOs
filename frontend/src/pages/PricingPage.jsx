import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Check,
    X,
    Sparkles,
    Zap,
    ShieldCheck,
    HelpCircle,
    ArrowRight,
    Gift,
    Terminal,
    Mic,
    FileText,
    Building2,
    Lock,
    Unlock,
    Activity
} from 'lucide-react';
import { useSubscription, PLAN_CONFIG } from '../contexts/SubscriptionContext';
import { CheckoutModal } from '../components/pricing/CheckoutModal';
import { ReferralModal } from '../components/common/ReferralModal';

export const PricingPage = () => {
    const [searchParams] = useSearchParams();
    const initialRef = searchParams.get('ref') || '';

    const {
        currentPlan,
        activePlanId,
        billingCycle: activeBillingCycle,
        upgradePlan,
        isVipBypass,
        isFounder,
        toggleDemoBypass,
        resetUsageCounters,
        usage,
        setIsReferralModalOpen
    } = useSubscription();

    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'quarterly'
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [targetPlanId, setTargetPlanId] = useState('premium');
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const handleSelectPlan = (planId) => {
        if (planId === 'free') return;
        setTargetPlanId(planId);
        setCheckoutModalOpen(true);
    };

    const handleCheckoutSuccess = (payload) => {
        upgradePlan(payload);
    };

    const faqs = [
        {
            q: "Can I pay using Google Pay, PhonePe, or Paytm UPI?",
            a: "Yes! CareerOS supports all Indian UPI apps (Google Pay, PhonePe, Paytm, CRED, BHIM) as well as Debit/Credit cards and Netbanking via secure 256-bit SSL gateway."
        },
        {
            q: "How does the referral system work?",
            a: "When you share your unique referral code with a friend and they purchase a Premium or Pro plan, you BOTH instantly receive +2 Free AI Voice Mock Interviews added to your balance."
        },
        {
            q: "What is the 3-Month Placement Pass?",
            a: "The Placement Pass gives you 3 full months of uninterrupted access at a 25% discount. It is specifically designed to cover your entire college campus placement and off-campus drive season."
        },
        {
            q: "What happens if I finish my voice interviews or ATS scans?",
            a: "You can easily refer a classmate to unlock +2 extra voice interviews, or upgrade to a higher tier at any time with immediate activation."
        },
        {
            q: "Can I cancel or change my plan anytime?",
            a: "Yes, you have full control. There are zero auto-lock contracts, and you can switch between plans whenever you wish."
        }
    ];

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1.5rem 4rem',
            color: '#f8fafc'
        }}>
            {/* Founder / Demo Sandbox Bar (Strictly hidden for regular students) */}
            {isFounder && (
                <div style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem' }}>
                        <Activity size={16} color="#818cf8" />
                        <span>
                            <strong>Founder VIP Sandbox:</strong> {isVipBypass ? (
                                <span style={{ color: '#4ade80', fontWeight: 700 }}>Active (Pro Plan Bypass Enabled)</span>
                            ) : (
                                <span style={{ color: '#94a3b8' }}>Inactive (Standard Quotas Apply)</span>
                            )}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                            type="button"
                            onClick={toggleDemoBypass}
                            style={{
                                background: isVipBypass ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                border: isVipBypass ? '1px solid #22c55e' : '1px solid rgba(99, 102, 241, 0.4)',
                                color: isVipBypass ? '#4ade80' : '#818cf8',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            {isVipBypass ? '🔓 VIP Bypass On' : '🔒 Toggle VIP Demo'}
                        </button>
                        <button
                            type="button"
                            onClick={resetUsageCounters}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#cbd5e1',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Reset Quotas
                        </button>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.9rem',
                    borderRadius: '999px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    color: '#818cf8',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '1rem'
                }}>
                    <Sparkles size={14} /> Built For College Students & Freshers
                </div>
                <h1 style={{
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    fontWeight: 900,
                    margin: '0 0 1rem',
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Invest in Your Career for Less Than a Pizza
                </h1>
                <p style={{
                    fontSize: '1.05rem',
                    color: '#94a3b8',
                    maxWidth: '650px',
                    margin: '0 auto 2rem',
                    lineHeight: 1.6
                }}>
                    Industry-grade AI work simulations, real-time voice mock interviews, and ATS resume polish. No hidden fees. Cancel anytime.
                </p>

                {/* Billing Cycle Toggle */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '999px',
                    padding: '4px',
                    position: 'relative'
                }}>
                    <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        style={{
                            padding: '0.5rem 1.4rem',
                            borderRadius: '999px',
                            background: billingCycle === 'monthly' ? '#6366f1' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Monthly
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillingCycle('quarterly')}
                        style={{
                            padding: '0.5rem 1.4rem',
                            borderRadius: '999px',
                            background: billingCycle === 'quarterly' ? '#6366f1' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span>3-Month Placement Pass</span>
                        <span style={{
                            background: '#22c55e',
                            color: '#000',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '999px'
                        }}>
                            SAVE 25%
                        </span>
                    </button>
                </div>
            </div>

            {/* 3 Pricing Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.75rem',
                alignItems: 'stretch',
                marginBottom: '4rem'
            }}>
                {/* 1. Free Starter */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: activePlanId === 'free' ? '2px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    padding: '2rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.4rem'
                        }}>
                            Free Starter
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>₹0</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ forever</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.5rem', minHeight: '38px' }}>
                            Test out CareerOS features and experience your first AI simulation.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={activePlanId === 'free'}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: activePlanId === 'free' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: activePlanId === 'free' ? '#94a3b8' : '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: activePlanId === 'free' ? 'default' : 'pointer',
                            marginBottom: '1.75rem'
                        }}
                    >
                        {activePlanId === 'free' ? 'Current Plan' : 'Free Forever'}
                    </button>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                            Included in Free:
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>1 Beginner Task</strong> (FIN-BEG-1 ISO-4217 Check)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>1 Voice Mock Interview</strong> (5 min session)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>1 ATS Resume Scan</strong> & Scorecard</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>Standard Technical Skill Guides</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#64748b' }}>
                                <X size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>No Intermediate or Pro Outage tasks</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#64748b' }}>
                                <X size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>No Auto-Apply Code Fixes</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 2. Student Premium (POPULAR) */}
                <div style={{
                    background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '2px solid #6366f1',
                    borderRadius: '18px',
                    padding: '2rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.25)'
                }}>
                    {/* Popular Pill */}
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.85rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                    }}>
                        ⚡ Most Popular For Freshers
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#818cf8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.4rem'
                        }}>
                            Student Premium
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>
                                ₹{billingCycle === 'quarterly' ? '349' : '149'}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                / {billingCycle === 'quarterly' ? '3 months' : 'month'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.5rem', minHeight: '38px' }}>
                            Master real microservices and drill technical voice rounds with Google XYZ bullets.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSelectPlan('premium')}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                            marginBottom: '1.75rem'
                        }}
                    >
                        <span>{activePlanId === 'premium' ? 'Current Active Plan' : 'Upgrade to Premium'}</span>
                        <ArrowRight size={16} />
                    </button>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                            Everything in Free, plus:
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>6 Simulation Tasks</strong> (Beginner + Intermediate)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>5 Voice Mock Interviews / mo</strong> (4-vector rubric)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>15 ATS Resume Scans</strong> + Google XYZ STAR polisher</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>Auto-Apply Code Fix</strong> button in Guided IDE</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>Skill-Gap Analysis & Kanban Application Tracker</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#64748b' }}>
                                <X size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>Pro Outage Simulations not included</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 3. Placement Pro */}
                <div style={{
                    background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '18px',
                    padding: '2rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#c084fc',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.4rem'
                        }}>
                            👑 Placement Pro
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>
                                ₹{billingCycle === 'quarterly' ? '699' : '299'}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                / {billingCycle === 'quarterly' ? '3 months' : 'month'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.5rem', minHeight: '38px' }}>
                            Complete placement season toolkit: Pro outages, Socratic AI mentor, and unlimited mock polish.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSelectPlan('pro')}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
                            marginBottom: '1.75rem'
                        }}
                    >
                        <span>{activePlanId === 'pro' ? 'Current Active Plan' : 'Get Placement Pro'}</span>
                        <ArrowRight size={16} />
                    </button>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                            Everything in Premium, plus:
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>All 9 Simulations</strong> (Includes 🔴 Pro Outages)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>12 Voice Mock Interviews / mo</strong> + Audio playback</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>40 ATS Resume Scans</strong> + Tailored Cover Letters</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>Full Pro IDE Workstation</strong> (Git Gutter & Terminal)</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>Marcus Socratic AI Mentor</strong> in Pro IDE</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Check size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>Campus Placement Readiness Pass</strong> (TPO shareable)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Referral Promotion Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1))',
                border: '1.5px dashed rgba(168, 85, 247, 0.4)',
                borderRadius: '16px',
                padding: '1.5rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginBottom: '4rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Gift size={24} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>
                            Want Free Voice Mock Interviews? Refer a Classmate!
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                            Give your unique code to a friend. When they upgrade to Premium or Pro, you <strong>BOTH get +2 Free Voice Interviews</strong>!
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsReferralModalOpen(true)}
                    style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '10px',
                        background: '#a855f7',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)'
                    }}
                >
                    <Gift size={16} />
                    <span>Open Referral Hub</span>
                </button>
            </div>

            {/* Student FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem' }}>
                    Frequently Asked Questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaqIndex === idx;
                        return (
                            <div
                                key={idx}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                    style={{
                                        width: '100%',
                                        padding: '1.1rem 1.25rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#f8fafc',
                                        fontSize: '0.92rem',
                                        fontWeight: 700,
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>{faq.q}</span>
                                    <span style={{ fontSize: '1.2rem', color: '#818cf8', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s ease' }}>
                                        +
                                    </span>
                                </button>
                                {isOpen && (
                                    <div style={{
                                        padding: '0 1.25rem 1.1rem',
                                        fontSize: '0.85rem',
                                        color: '#94a3b8',
                                        lineHeight: 1.6
                                    }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Checkout Sandbox Modal */}
            <CheckoutModal
                isOpen={checkoutModalOpen}
                onClose={() => setCheckoutModalOpen(false)}
                selectedPlanId={targetPlanId}
                billingCycle={billingCycle}
                onSuccess={handleCheckoutSuccess}
                initialReferralCode={initialRef}
            />

            {/* Referral Modal */}
            <ReferralModal />
        </div>
    );
};
