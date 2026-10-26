import React, { useState } from 'react';
import {
    X,
    Gift,
    Copy,
    Check,
    Share2,
    Users,
    Sparkles,
    Mic,
    ArrowRight,
    Zap,
    Trophy
} from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useToast } from '../../contexts/ToastContext';

export const ReferralModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const { referral, simulateFriendReferralPurchase, isFounder } = useSubscription();
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const referralCode = referral?.code || 'CAREER-VIP';
    const bonusCredits = referral?.bonusInterviews || 0;
    const convertedCount = referral?.convertedFriendsCount || 0;

    const shareUrl = `${window.location.origin}/pricing?ref=${referralCode}`;
    const whatsappMessage = encodeURIComponent(
        `Hey! I'm preparing for tech campus placements using CareerOS (AI Work Simulations & Voice Mock Interviews). Use my referral code *${referralCode}* to get +2 Free AI Voice Mock Interviews when you upgrade: ${shareUrl}`
    );

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        showToast('Referral code copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        showToast('Referral link copied to clipboard!', 'success');
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
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
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.2)',
                overflow: 'hidden',
                color: '#f8fafc',
                position: 'relative'
            }}>
                {/* Header Banner */}
                <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1))',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        background: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#c084fc',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem'
                    }}>
                        <Gift size={13} /> Give 2, Get 2 Program
                    </div>

                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Invite Friends & Unlock Free Voice Interviews
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        When your friend joins and purchases any plan (Premium or Pro), you <strong>BOTH receive +2 Free AI Voice Mock Interviews</strong>!
                    </p>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Live Stats Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                                <Users size={14} /> Friends Upgraded
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                                {convertedCount}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(168, 85, 247, 0.08)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.75rem' }}>
                                <Mic size={14} /> Bonus Voice Credits Earned
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc', marginTop: '0.2rem' }}>
                                +{bonusCredits}
                            </div>
                        </div>
                    </div>

                    {/* Referral Code Box */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                            Your Personal Referral Code
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1.5px dashed rgba(168, 85, 247, 0.5)',
                            borderRadius: '10px',
                            padding: '0.65rem 1rem'
                        }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.08em', color: '#f1f5f9' }}>
                                {referralCode}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                    border: copied ? '1px solid #22c55e' : '1px solid rgba(168, 85, 247, 0.4)',
                                    color: copied ? '#4ade80' : '#c084fc',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied' : 'Copy Code'}
                            </button>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <a
                            href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                background: '#25D366',
                                color: '#000',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                            }}
                        >
                            <span>Share on WhatsApp</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleCopyLink}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#f8fafc',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <Share2 size={16} />
                            <span>Copy Link</span>
                        </button>
                    </div>

                    {/* Developer / Tester Helper: Simulate Friend Upgrade (Visible only to Founder) */}
                    {isFounder && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                <span style={{ fontWeight: 600, color: '#f8fafc' }}>Founder Test Trigger:</span> Simulate friend buying plan
                            </div>
                            <button
                                type="button"
                                onClick={() => simulateFriendReferralPurchase('Rahul Verma')}
                                style={{
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    border: '1px solid rgba(99, 102, 241, 0.4)',
                                    color: '#818cf8',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                + Test Unlock
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
