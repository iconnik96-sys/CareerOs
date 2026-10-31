import { isFounderUser } from '../utils/founderAuth';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Define exact quotas per tier as agreed
export const PLAN_CONFIG = {
    free: {
        id: 'free',
        name: 'Free Starter',
        priceMonthly: 0,
        priceQuarterly: 0,
        badge: '🟢 Free',
        simulations_allowed: 1, // Only FIN-BEG-1
        voice_interviews_allowed: 1, // 1 session (5 questions)
        voice_duration_minutes: 5,
        resume_scans_allowed: 2,
        cover_letters_allowed: 2,
        can_access_intermediate: false,
        can_access_pro: false,
        guided_autofill: false,
        pro_ide_mentor: false,
        model_answers: false,
        campus_placement_pass: false,
    },
    pro: {
        id: 'pro',
        name: 'Placement Pro',
        priceMonthly: 149,
        priceQuarterly: 349, // 3-month placement pass discount
        badge: '⚡ Placement Pro',
        simulations_allowed: 6,
        voice_interviews_allowed: 10, // 10 sessions per month
        voice_duration_minutes: 20,
        resume_scans_allowed: 25,
        cover_letters_allowed: 10,
        can_access_intermediate: true,
        can_access_pro: false,
        guided_autofill: true,
        pro_ide_mentor: false,
        model_answers: true,
        campus_placement_pass: false,
    },
    premium: {
        id: 'pro',
        name: 'Placement Pro',
        priceMonthly: 149,
        priceQuarterly: 349,
        badge: '⚡ Placement Pro',
        simulations_allowed: 6,
        voice_interviews_allowed: 10,
        voice_duration_minutes: 20,
        resume_scans_allowed: 25,
        cover_letters_allowed: 10,
        can_access_intermediate: true,
        can_access_pro: false,
        guided_autofill: true,
        pro_ide_mentor: false,
        model_answers: true,
        campus_placement_pass: false,
    },
    ultimate: {
        id: 'ultimate',
        name: 'Placement Ultimate',
        priceMonthly: 249,
        priceQuarterly: 599, // 3-month placement pass discount
        badge: '👑 Placement Ultimate',
        simulations_allowed: 20, // All tasks including Pro Outages
        voice_interviews_allowed: 30, // 30 sessions per month
        voice_duration_minutes: 30,
        resume_scans_allowed: 75,
        cover_letters_allowed: 30,
        can_access_intermediate: true,
        can_access_pro: true,
        guided_autofill: true,
        pro_ide_mentor: true,
        model_answers: true,
        campus_placement_pass: true,
    }
};

const STORAGE_KEY = 'careeros_subscription_state_v1';

const SubscriptionContext = createContext(undefined);

export const SubscriptionProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();

    // Load initial state or defaults
    const [subscriptionState, setSubscriptionState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to parse subscription state from localStorage', e);
        }
        return {
            planId: 'free',
            billingCycle: 'monthly',
            activatedAt: null,
            expiresAt: null,
            usage: {
                simulations_completed: [], // array of ticket codes, e.g. ['FIN-BEG-1']
                voice_interviews_count: 0,
                resume_scans_count: 0,
                cover_letters_count: 0,
            },
            referral: {
                code: '',
                bonusInterviews: 0,
                referredFriendsCount: 0,
                convertedFriendsCount: 0,
                referralHistory: []
            },
            isDemoBypass: false
        };
    });

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeModalReason, setUpgradeModalReason] = useState(null);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

    // Save to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptionState));
        } catch (e) {
            console.warn('Failed to write subscription state to localStorage', e);
        }
    }, [subscriptionState]);

    // Generate unique referral code for user if missing
    useEffect(() => {
        if (!subscriptionState.referral?.code) {
            const seed = (user?.id || profile?.id || Math.random().toString(36).substring(2, 7))
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(-4)
                .toUpperCase();
            const newCode = `CAREER-${seed || '7X9Q'}`;
            setSubscriptionState(prev => ({
                ...prev,
                referral: {
                    ...prev.referral,
                    code: newCode
                }
            }));
        }
    }, [user, profile, subscriptionState.referral?.code]);

    // Check if current user qualifies for Demo / VIP bypass (Founder or Admin)
    const isFounder = isFounderUser(user, profile);
    // ANTI-ABUSE CHECK 1: Only genuine founders/admins are permitted to activate demo VIP bypass
    const isVipBypass = isFounder && Boolean(subscriptionState.isDemoBypass);

    // ANTI-ABUSE CHECK 2: Validate expiration timestamp and genuine activation dates
    const isExpired = subscriptionState.expiresAt && new Date(subscriptionState.expiresAt) < new Date();
    const hasValidActivation = Boolean(subscriptionState.activatedAt && subscriptionState.expiresAt && !isExpired);
    
    // Server-assigned plan via auth metadata takes absolute precedence
    const serverPlan = (user?.app_metadata?.plan_id || '').toLowerCase().trim();

    // Active plan resolution
    const activePlanId = isVipBypass ? 'pro' : (serverPlan || (hasValidActivation ? subscriptionState.planId : 'free'));
    const currentPlan = PLAN_CONFIG[activePlanId] || PLAN_CONFIG.free;

    // Total voice interviews allowed (Base tier quota + referral bonus credits)
    const totalVoiceInterviewsAllowed = isVipBypass
        ? 9999
        : (currentPlan.voice_interviews_allowed + (subscriptionState.referral?.bonusInterviews || 0));

    /**
     * Check if user is allowed to access a given feature/quota
     * @param {'simulation' | 'voice_interview' | 'resume_scan' | 'cover_letter' | 'pro_ide' | 'guided_autofill'} featureKey
     * @param {Object} [meta]
     */
    const checkFeatureAccess = (featureKey, meta = {}) => {
        if (isVipBypass) {
            return { allowed: true, remaining: 9999, limit: 9999, reason: 'VIP_UNLIMITED' };
        }

        switch (featureKey) {
            case 'simulation': {
                const ticketCode = meta.ticketCode || '';
                const levelId = meta.levelId || 'beginner';

                // Check level lock
                if (levelId === 'intermediate' && !currentPlan.can_access_intermediate) {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit: currentPlan.simulations_allowed,
                        reason: 'INTERMEDIATE_LOCKED',
                        message: 'Intermediate simulations require Student Premium or Placement Pro.'
                    };
                }
                if (levelId === 'pro' && !currentPlan.can_access_pro) {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit: currentPlan.simulations_allowed,
                        reason: 'PRO_LOCKED',
                        message: 'Pro Outage simulations require the Placement Pro plan.'
                    };
                }

                // Check task quota
                const completedCount = subscriptionState.usage.simulations_completed?.length || 0;
                const isAlreadyCompleted = subscriptionState.usage.simulations_completed?.includes(ticketCode);
                
                // Allow re-running an already unlocked task
                if (isAlreadyCompleted) {
                    return { allowed: true, remaining: Math.max(0, currentPlan.simulations_allowed - completedCount), limit: currentPlan.simulations_allowed };
                }

                // If Free, only FIN-BEG-1 is unlocked
                if (activePlanId === 'free' && ticketCode && ticketCode !== 'FIN-BEG-1') {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit: 1,
                        reason: 'FREE_LIMIT_REACHED',
                        message: 'Free Starter plan includes 1 Beginner simulation (FIN-BEG-1). Upgrade to Premium to unlock 6 tasks!'
                    };
                }

                if (completedCount >= currentPlan.simulations_allowed) {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit: currentPlan.simulations_allowed,
                        reason: 'SIM_QUOTA_EXHAUSTED',
                        message: `You have completed all ${currentPlan.simulations_allowed} simulation tasks in your ${currentPlan.name}.`
                    };
                }

                return {
                    allowed: true,
                    remaining: currentPlan.simulations_allowed - completedCount,
                    limit: currentPlan.simulations_allowed
                };
            }

            case 'voice_interview': {
                const used = subscriptionState.usage.voice_interviews_count || 0;
                const remaining = Math.max(0, totalVoiceInterviewsAllowed - used);
                if (remaining <= 0) {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit: totalVoiceInterviewsAllowed,
                        reason: 'VOICE_LIMIT_REACHED',
                        message: `You have reached your limit of ${totalVoiceInterviewsAllowed} Voice Mock Interviews. Upgrade or refer friends for +2 free interviews!`
                    };
                }
                return { allowed: true, remaining, limit: totalVoiceInterviewsAllowed };
            }

            case 'resume_scan': {
                const used = subscriptionState.usage.resume_scans_count || 0;
                const limit = currentPlan.resume_scans_allowed;
                const remaining = Math.max(0, limit - used);
                if (remaining <= 0) {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit,
                        reason: 'RESUME_LIMIT_REACHED',
                        message: `You have reached your limit of ${limit} ATS Resume Scans. Upgrade to Premium for 15 scans or Pro for 40 scans!`
                    };
                }
                return { allowed: true, remaining, limit };
            }

            case 'cover_letter': {
                const used = subscriptionState.usage.cover_letters_count || 0;
                const limit = currentPlan.cover_letters_allowed;
                if (limit === 0) {
                    return {
                        allowed: false,
                        remaining: 0,
                        limit: 0,
                        reason: 'FEATURE_NOT_IN_PLAN',
                        message: 'Tailored Cover Letter Generator is available on Premium and Pro plans.'
                    };
                }
                const remaining = Math.max(0, limit - used);
                return { allowed: remaining > 0, remaining, limit };
            }

            case 'guided_autofill': {
                const allowed = Boolean(currentPlan.guided_autofill);
                return {
                    allowed,
                    reason: allowed ? 'OK' : 'PREMIUM_REQUIRED',
                    message: 'Auto-Apply Code Fix is available on Student Premium and Pro plans.'
                };
            }

            case 'pro_ide': {
                const allowed = Boolean(currentPlan.pro_ide_mentor);
                return {
                    allowed,
                    reason: allowed ? 'OK' : 'PRO_REQUIRED',
                    message: 'Full Pro IDE Workstation (Git Gutter, Terminal & Socratic Mentor) requires Placement Pro.'
                };
            }

            default:
                return { allowed: true, remaining: 999, limit: 999 };
        }
    };

    /**
     * Increment usage for a feature
     */
    const recordUsage = (featureKey, meta = {}) => {
        if (isVipBypass) return;

        setSubscriptionState(prev => {
            const newUsage = { ...prev.usage };
            if (featureKey === 'simulation' && meta.ticketCode) {
                if (!newUsage.simulations_completed.includes(meta.ticketCode)) {
                    newUsage.simulations_completed = [...newUsage.simulations_completed, meta.ticketCode];
                }
            } else if (featureKey === 'voice_interview') {
                newUsage.voice_interviews_count = (newUsage.voice_interviews_count || 0) + 1;
            } else if (featureKey === 'resume_scan') {
                newUsage.resume_scans_count = (newUsage.resume_scans_count || 0) + 1;
            } else if (featureKey === 'cover_letter') {
                newUsage.cover_letters_count = (newUsage.cover_letters_count || 0) + 1;
            }
            return {
                ...prev,
                usage: newUsage
            };
        });
    };

    /**
     * Trigger the upgrade modal with context
     */
    const triggerUpgradeModal = (reasonObj) => {
        setUpgradeModalReason(reasonObj);
        setIsUpgradeModalOpen(true);
    };

    const closeUpgradeModal = () => {
        setIsUpgradeModalOpen(false);
        setUpgradeModalReason(null);
    };

    /**
     * Upgrade plan (called after mock or real payment)
     */
    const upgradePlan = ({ planId, billingCycle = 'monthly', referralCodeUsed = '' }) => {
        const now = new Date();
        const durationDays = billingCycle === 'quarterly' ? 90 : 30;
        const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        setSubscriptionState(prev => {
            let updatedReferral = { ...prev.referral };
            const cleanCode = (referralCodeUsed || '').trim().toUpperCase();

            // ANTI-ABUSE CHECK 1: Disallow self-referral
            const isSelfReferral = cleanCode && cleanCode === (prev.referral?.code || '').toUpperCase();
            
            // ANTI-ABUSE CHECK 2: Disallow multiple referral redemptions by the same account
            const alreadyRedeemed = Boolean(prev.referral?.hasRedeemedBonus);

            if (cleanCode && !isSelfReferral && !alreadyRedeemed) {
                updatedReferral.bonusInterviews = (updatedReferral.bonusInterviews || 0) + 2;
                updatedReferral.hasRedeemedBonus = true;
                updatedReferral.referralHistory = [
                    ...updatedReferral.referralHistory,
                    {
                        codeUsed: cleanCode,
                        bonusAwarded: 2,
                        date: now.toISOString()
                    }
                ];
            }

            return {
                ...prev,
                planId,
                billingCycle,
                activatedAt: now.toISOString(),
                expiresAt: expiry.toISOString(),
                referral: updatedReferral
            };
        });

        showToast(`🎉 Upgraded to ${PLAN_CONFIG[planId]?.name || 'new plan'} successfully!`, 'success');
    };

    /**
     * Toggle Demo Bypass (for testing without real money)
     */
    const toggleDemoBypass = () => {
        if (!isFounder) {
            showToast('VIP Sandbox mode is only available for authorized founders.', 'warning');
            return;
        }
        setSubscriptionState(prev => {
            const nextVal = !prev.isDemoBypass;
            showToast(nextVal ? '⚡ Demo/VIP Pro Bypass Activated!' : 'Demo Bypass Deactivated', nextVal ? 'success' : 'info');
            return {
                ...prev,
                isDemoBypass: nextVal
            };
        });
    };

    /**
     * Reset usage counters (useful for testing or month reset)
     */
    const resetUsageCounters = () => {
        if (!isFounder) {
            showToast('Usage counter reset is restricted to authorized founders.', 'warning');
            return;
        }
        setSubscriptionState(prev => ({
            ...prev,
            usage: {
                simulations_completed: [],
                voice_interviews_count: 0,
                resume_scans_count: 0,
                cover_letters_count: 0
            }
        }));
        showToast('All usage counters reset for testing', 'info');
    };

    /**
     * Simulate a friend using this user's referral code to purchase
     */
    const simulateFriendReferralPurchase = (friendName = 'Priya Sharma') => {
        if (!isFounder) {
            showToast('Referral purchase simulator is restricted to authorized founders.', 'warning');
            return;
        }
        setSubscriptionState(prev => {
            const newBonus = (prev.referral?.bonusInterviews || 0) + 2;
            const newCount = (prev.referral?.convertedFriendsCount || 0) + 1;
            return {
                ...prev,
                referral: {
                    ...prev.referral,
                    bonusInterviews: newBonus,
                    convertedFriendsCount: newCount,
                    referralHistory: [
                        ...prev.referral.referralHistory,
                        {
                            type: 'friend_purchased',
                            friendName,
                            bonusAwarded: 2,
                            date: new Date().toISOString()
                        }
                    ]
                }
            };
        });
        showToast(`🎁 Referral Bonus! ${friendName} upgraded! You earned +2 Voice Mock Interviews!`, 'success');
    };

    return (
        <SubscriptionContext.Provider value={{
            currentPlan,
            activePlanId,
            billingCycle: subscriptionState.billingCycle,
            usage: subscriptionState.usage,
            referral: subscriptionState.referral,
            totalVoiceInterviewsAllowed,
            isVipBypass,
            isFounder,
            checkFeatureAccess,
            recordUsage,
            upgradePlan,
            toggleDemoBypass,
            resetUsageCounters,
            simulateFriendReferralPurchase,
            isUpgradeModalOpen,
            upgradeModalReason,
            triggerUpgradeModal,
            closeUpgradeModal,
            isReferralModalOpen,
            setIsReferralModalOpen
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
