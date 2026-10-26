import React, { useState } from 'react';
import {
    X,
    Check,
    ShieldCheck,
    CreditCard,
    QrCode,
    Sparkles,
    Lock,
    Zap,
    Gift,
    Smartphone,
    ArrowRight
} from 'lucide-react';
import { PLAN_CONFIG, useSubscription } from '../../contexts/SubscriptionContext';

export const CheckoutModal = ({
    isOpen,
    onClose,
    selectedPlanId = 'premium',
    billingCycle = 'monthly',
    onSuccess,
    initialReferralCode = ''
}) => {
    if (!isOpen) return null;

    const { referral } = useSubscription();
    const plan = PLAN_CONFIG[selectedPlanId] || PLAN_CONFIG.premium;
    const price = billingCycle === 'quarterly' ? plan.priceQuarterly : plan.priceMonthly;
    const periodLabel = billingCycle === 'quarterly' ? '3 Months (Placement Pass)' : 'Month';

    const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'qr'
    const [upiId, setUpiId] = useState('');
    const [referralCode, setReferralCode] = useState(initialReferralCode);
    const [referralApplied, setReferralApplied] = useState(false);
    const [referralError, setReferralError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStep, setPaymentStep] = useState('details'); // 'details' | 'processing' | 'success'

    const handleApplyReferral = () => {
        setReferralError('');
        const cleanCode = referralCode.trim().toUpperCase();
        if (!cleanCode) return;

        // Loophole fix: disallow self-referral
        if (cleanCode === (referral?.code || '').toUpperCase()) {
            setReferralError('You cannot redeem your own referral code.');
            return;
        }

        // Loophole fix: disallow multiple redemptions
        if (referral?.hasRedeemedBonus) {
            setReferralError('You have already redeemed a referral bonus on a previous purchase.');
            return;
        }

        setReferralApplied(true);
    };

    const handleConfirmPayment = () => {
        setIsProcessing(true);
        setPaymentStep('processing');

        // Simulate 2s sandbox payment processing
        setTimeout(() => {
            setIsProcessing(false);
            setPaymentStep('success');

            // Trigger success callback after 1.5s celebratory animation
            setTimeout(() => {
                onSuccess({
                    planId: selectedPlanId,
                    billingCycle,
                    referralCodeUsed: referralApplied ? referralCode.trim() : ''
                });
                onClose();
            }, 1800);
        }, 2200);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(5, 7, 15, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #0e1526, #090d16)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
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
                    background: 'rgba(99, 102, 241, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShieldCheck size={18} color="#fff" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                Secure Checkout Sandbox
                            </h3>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                Instant Upgrade • Test Sandbox Mode
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body State: Processing */}
                {paymentStep === 'processing' && (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            margin: '0 auto 1.5rem',
                            borderRadius: '50%',
                            border: '4px solid rgba(99, 102, 241, 0.2)',
                            borderTopColor: '#6366f1',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                            Connecting to Bank Gateway...
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                            Verifying payment token & provisioning account quota. Please do not close this window.
                        </p>
                    </div>
                )}

                {/* Body State: Success */}
                {paymentStep === 'success' && (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center', animation: 'scaleUp 0.3s ease-out' }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            margin: '0 auto 1.25rem',
                            borderRadius: '50%',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '2px solid #22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Check size={32} color="#22c55e" />
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
                            Payment Successful!
                        </h4>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                            Your account has been upgraded to <strong>{plan.name}</strong>.
                        </p>
                        {referralApplied && (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '999px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                color: '#c084fc',
                                fontSize: '0.78rem',
                                fontWeight: 600
                            }}>
                                <Gift size={14} /> +2 Bonus Voice Interviews Unlocked!
                            </div>
                        )}
                    </div>
                )}

                {/* Body State: Details */}
                {paymentStep === 'details' && (
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {/* Order Summary Box */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    color: '#818cf8'
                                }}>
                                    Selected Plan
                                </span>
                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                                    {plan.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Billed per {periodLabel}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                                    ₹{price}
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 600 }}>
                                    Inclusive of all taxes
                                </span>
                            </div>
                        </div>

                        {/* Referral Code Box */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                                Friend's Referral Code (Optional)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="e.g. CAREER-7X9Q"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                    disabled={referralApplied}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(15, 23, 42, 0.8)',
                                        border: referralApplied ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '8px',
                                        padding: '0.55rem 0.75rem',
                                        fontSize: '0.85rem',
                                        color: '#fff',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase'
                                    }}
                                />
                                {referralApplied ? (
                                    <button
                                        type="button"
                                        onClick={() => { setReferralApplied(false); setReferralCode(''); }}
                                        style={{
                                            padding: '0.55rem 0.85rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#f87171',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleApplyReferral}
                                        style={{
                                            padding: '0.55rem 0.85rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(99, 102, 241, 0.4)',
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            color: '#818cf8',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            {referralApplied && (
                                <span style={{ fontSize: '0.72rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <Check size={12} /> Code active! You & your friend both get +2 free voice interviews!
                                </span>
                            )}
                            {referralError && (
                                <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    ⚠️ {referralError}
                                </span>
                            )}
                        </div>

                        {/* Payment Method Selector */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                                Select Payment Method (Sandbox / Test Mode)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                {[
                                    { id: 'upi', label: 'UPI / GPay', icon: <Smartphone size={16} /> },
                                    { id: 'qr', label: 'Scan QR', icon: <QrCode size={16} /> },
                                    { id: 'card', label: 'Cards / NetBank', icon: <CreditCard size={16} /> },
                                ].map((method) => {
                                    const isSelected = paymentMethod === method.id;
                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.id)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.65rem 0.5rem',
                                                borderRadius: '10px',
                                                background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                                                border: isSelected ? '1.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                                                color: isSelected ? '#fff' : '#94a3b8',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {method.icon}
                                            <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 500 }}>
                                                {method.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method Input Preview */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            marginBottom: '1.25rem'
                        }}>
                            {paymentMethod === 'upi' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Enter VPA / UPI ID</span>
                                        <span style={{ fontSize: '0.68rem', color: '#6366f1' }}>PhonePe • GPay • Paytm • BHIM</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="username@okhdfcbank or 9876543210@paytm"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '6px',
                                            padding: '0.5rem 0.65rem',
                                            fontSize: '0.8rem',
                                            color: '#fff',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            )}

                            {paymentMethod === 'qr' && (
                                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.5rem',
                                        background: '#fff',
                                        borderRadius: '8px',
                                        marginBottom: '0.4rem'
                                    }}>
                                        <QrCode size={90} color="#000" />
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                                        Scan with any UPI App (Google Pay, PhonePe, Paytm, CRED)
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'card' && (
                                <div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                        Simulated Test Card (Sandbox)
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '0.8rem',
                                        color: '#cbd5e1',
                                        padding: '0.4rem 0.6rem',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: '6px'
                                    }}>
                                        <span>•••• •••• •••• 4242</span>
                                        <span>12/28</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pay Button */}
                        <button
                            type="button"
                            onClick={handleConfirmPayment}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.92rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>Pay ₹{price} & Upgrade Instantly</span>
                            <ArrowRight size={16} />
                        </button>

                        <div style={{
                            marginTop: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            fontSize: '0.68rem',
                            color: '#64748b'
                        }}>
                            <Lock size={12} /> 256-bit SSL Test Sandbox • 100% Risk Free
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
