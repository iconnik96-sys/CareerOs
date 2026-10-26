import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Lock,
    Sparkles,
    Gift,
    ArrowRight,
    Zap,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

export const UpgradeModal = ({ isOpen, onClose, reasonObj }) => {
    const navigate = useNavigate();
    const { setIsReferralModalOpen } = useSubscription();

    if (!isOpen) return null;

    const message = reasonObj?.message || 'You have reached the limit for your current plan.';
    const reason = reasonObj?.reason || 'LIMIT_REACHED';

    const handleViewPricing = () => {
        onClose();
        navigate('/pricing');
    };

    const handleOpenReferral = () => {
        onClose();
        setIsReferralModalOpen(true);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            backgroundColor: 'rgba(5, 7, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #0e1526, #090d16)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
                overflow: 'hidden',
                color: '#f8fafc',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(99, 102, 241, 0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Lock size={16} color="#f87171" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                            Plan Limit Reached
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem' }}>
                    <p style={{
                        margin: '0 0 1.25rem',
                        fontSize: '0.92rem',
                        color: '#cbd5e1',
                        lineHeight: 1.5,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '0.85rem',
                        borderRadius: '8px'
                    }}>
                        {message}
                    </p>

                    <div style={{
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1.25rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                            What you unlock on Premium (₹149/mo):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                            <li><strong>6 Work Simulations</strong> (Beginner + Intermediate)</li>
                            <li><strong>5 Voice Mock Interviews</strong> / month with 4-vector rubric</li>
                            <li><strong>15 ATS Resume Scans</strong> + Google XYZ polish</li>
                            <li><strong>Auto-Apply Code Fixes</strong> in Guided IDE</li>
                        </ul>
                    </div>

                    {/* CTAs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <button
                            type="button"
                            onClick={handleViewPricing}
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
                                gap: '0.5rem',
                                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            <span>Explore Plans (Starting at ₹149)</span>
                            <ArrowRight size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenReferral}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                background: 'rgba(168, 85, 247, 0.12)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                color: '#c084fc',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Gift size={16} />
                            <span>Refer a Friend for +2 Free Voice Interviews</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
