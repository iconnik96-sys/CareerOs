import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Terminal,
    Building2,
    CheckCircle2,
    Clock,
    ArrowRight,
    ArrowLeft,
    Code2,
    Sparkles,
    ShieldCheck,
    Layers,
    Cpu,
    Briefcase,
    Zap,
    Lock,
    Play,
    Check,
    CreditCard,
    Activity,
    Cloud,
    ChevronRight,
    FileCode,
    AlertCircle,
    MessageSquare,
    Copy,
    X
} from 'lucide-react';
import { SIMULATION_COMPANIES, getCompanyById, getLevelData, getInterviewPitchForTask } from '../data/simulationCatalog';
import { DeveloperSimulationLab } from '../components/simulation/DeveloperSimulationLab';
import { useSubscription } from '../contexts/SubscriptionContext';

export const SimulationsPage = () => {
    const navigate = useNavigate();
    const {
        currentPlan,
        activePlanId,
        checkFeatureAccess,
        triggerUpgradeModal,
        isVipBypass
    } = useSubscription();

    // 3-Step Selection Funnel: 'company' -> 'level' -> 'review'
    const [currentStep, setCurrentStep] = useState('company'); // 'company' | 'level' | 'review'
    const [selectedCompanyId, setSelectedCompanyId] = useState('finpulse-payments');
    const [selectedLevelId, setSelectedLevelId] = useState('beginner'); // 'beginner' | 'intermediate' | 'pro'
    const [activeReviewTaskIndex, setActiveReviewTaskIndex] = useState(0);

    // Full-screen Simulation IDE Modal state
    const [showIdeLab, setShowIdeLab] = useState(false);
    const [ideInitialTicket, setIdeInitialTicket] = useState(null);

    // Interview Pitch Cheatsheet Modal State
    const [pitchModalTask, setPitchModalTask] = useState(null);
    const [copiedPitch, setCopiedPitch] = useState(false);

    const selectedCompany = getCompanyById(selectedCompanyId);
    const selectedLevelData = getLevelData(selectedCompanyId, selectedLevelId);

    const handleSelectCompany = (companyId) => {
        setSelectedCompanyId(companyId);
        setCurrentStep('level');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectLevel = (levelId) => {
        const access = checkFeatureAccess('simulation', { levelId });
        if (!access.allowed) {
            triggerUpgradeModal(access);
            return;
        }
        setSelectedLevelId(levelId);
        setActiveReviewTaskIndex(0);
        setCurrentStep('review');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLaunchIde = (ticketCode = null) => {
        const ticketToOpen = ticketCode || selectedLevelData?.tasks?.[0]?.code || 'FIN-BEG-1';
        const access = checkFeatureAccess('simulation', { ticketCode: ticketToOpen, levelId: selectedLevelId });
        if (!access.allowed) {
            triggerUpgradeModal(access);
            return;
        }
        setIdeInitialTicket(ticketToOpen);
        setShowIdeLab(true);
    };

    return (
        <div className="page-container" style={{ padding: '1.5rem clamp(0.75rem, 3vw, 2rem) 5rem clamp(0.75rem, 3vw, 2rem)', maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            
            {/* 1. PROGRESS STEPPER BREADCRUMB (Clear & unconfusing for new students) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '2.5rem',
                flexWrap: 'wrap'
            }}>
                {/* Step 1: Company */}
                <div 
                    onClick={() => setCurrentStep('company')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: currentStep === 'company' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: currentStep === 'company' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: currentStep === 'company' ? '#60a5fa' : '#94a3b8',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Building2 size={15} />
                    <span>1. Select Company</span>
                </div>

                <ChevronRight size={16} color="#475569" />

                {/* Step 2: Experience Level */}
                <div 
                    onClick={() => {
                        if (currentStep === 'review') setCurrentStep('level');
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: currentStep !== 'company' ? 'pointer' : 'default',
                        background: currentStep === 'level' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: currentStep === 'level' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: currentStep === 'level' ? '#60a5fa' : currentStep === 'review' ? '#f8fafc' : '#64748b',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Layers size={15} />
                    <span>2. Difficulty Level</span>
                </div>

                <ChevronRight size={16} color="#475569" />

                {/* Step 3: Sprint Review */}
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        background: currentStep === 'review' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: currentStep === 'review' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: currentStep === 'review' ? '#60a5fa' : '#64748b',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <CheckCircle2 size={15} />
                    <span>3. Sprint Task Briefing</span>
                </div>

                <ChevronRight size={16} color="#475569" />

                {/* Step 4: IDE */}
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#64748b'
                    }}
                >
                    <Terminal size={15} />
                    <span>4. Simulation IDE</span>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 1: COMPANY SELECTION SCREEN                                          */}
            {/* ========================================================================= */}
            {currentStep === 'company' && (
                <div>
                    {/* Header */}
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem auto' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            marginBottom: '1rem'
                        }}>
                            <Building2 size={15} />
                            <span>Step 1 of 3 • Select Company Partner</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.85rem 0', letterSpacing: '-0.02em' }}>
                            Corporate AI Work Simulation Lab
                        </h1>
                        <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Step into real engineering teams. Experience production codebases, solve high-impact sprint tickets, and prove your engineering readiness to employers.
                        </p>
                    </div>

                    {/* Company Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
                        {SIMULATION_COMPANIES.map((company) => {
                            const isAvailable = company.available;
                            return (
                                <div
                                    key={company.id}
                                    style={{
                                        background: isAvailable ? 'var(--bg-card)' : 'rgba(255, 255, 255, 0.02)',
                                        border: isAvailable ? '2px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '2rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: isAvailable ? '0 12px 35px rgba(59, 130, 246, 0.15)' : 'none',
                                        opacity: isAvailable ? 1 : 0.65,
                                        transition: 'all 0.25s ease'
                                    }}
                                >
                                    {/* Top Bar with Badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <div style={{
                                            width: 46,
                                            height: 46,
                                            borderRadius: '12px',
                                            backgroundColor: company.accentColor ? `${company.accentColor}20` : 'rgba(59, 130, 246, 0.15)',
                                            border: `1px solid ${company.accentColor ? `${company.accentColor}40` : 'rgba(59, 130, 246, 0.3)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: company.accentColor || '#60a5fa'
                                        }}>
                                            {company.logoType === 'heart-pulse' ? (
                                                <Activity size={24} />
                                            ) : company.logoType === 'cloud' ? (
                                                <Cloud size={24} />
                                            ) : (
                                                <CreditCard size={24} />
                                            )}
                                        </div>

                                        <span style={{
                                            fontSize: '0.725rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            padding: '0.25rem 0.65rem',
                                            borderRadius: 'var(--radius-full)',
                                            backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                            color: isAvailable ? '#34d399' : '#94a3b8'
                                        }}>
                                            {company.badge}
                                        </span>
                                    </div>

                                    {/* Company Title & Role */}
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                                        {company.name}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700, marginBottom: '0.85rem' }}>
                                        Role: {company.role}
                                    </div>

                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 1.25rem 0', flex: 1 }}>
                                        {company.description}
                                    </p>

                                    {/* Scale Metrics & Tech Stack */}
                                    <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Scale & Infrastructure:
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.85rem' }}>
                                            ⚡ {company.scaleMetrics}
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {company.stack.map(tech => (
                                                <span key={tech} style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: 'rgba(255, 255, 255, 0.06)',
                                                    color: '#cbd5e1',
                                                    fontWeight: 600
                                                }}>
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    {isAvailable ? (
                                        <button
                                            onClick={() => handleSelectCompany(company.id)}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem 1.25rem',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                color: '#ffffff',
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)'
                                            }}
                                        >
                                            <span>Select Company & Choose Level</span>
                                            <ArrowRight size={17} />
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem 1.25rem',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: '#64748b',
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                cursor: 'not-allowed'
                                            }}
                                        >
                                            In Development (Coming Soon)
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DIFFICULTY LEVEL SELECTION SCREEN                                  */}
            {/* ========================================================================= */}
            {currentStep === 'level' && (
                <div>
                    {/* Top Back Action & Company Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <button
                            onClick={() => setCurrentStep('company')}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Companies</span>
                        </button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            fontSize: '0.8125rem',
                            fontWeight: 700
                        }}>
                            {selectedCompany.logoType === 'heart-pulse' ? (
                                <Activity size={14} />
                            ) : selectedCompany.logoType === 'cloud' ? (
                                <Cloud size={14} />
                            ) : (
                                <CreditCard size={14} />
                            )}
                            <span>Active Company: {selectedCompany.name}</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            marginBottom: '0.85rem'
                        }}>
                            <Layers size={15} />
                            <span>Step 2 of 3 • Select Difficulty Level</span>
                        </div>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
                            Choose Your Simulation Experience Level
                        </h2>
                        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Each level contains <strong>3 real hands-on sprint tickets</strong>. Start with gentle step-by-step guidance or dive straight into high-concurrency production outages.
                        </p>
                    </div>

                    {/* 3 Difficulty Level Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.75rem' }}>
                        {Object.values(selectedCompany.levels).map((lvl) => {
                            const isBeginner = lvl.levelId === 'beginner';
                            const isIntermediate = lvl.levelId === 'intermediate';
                            const isPro = lvl.levelId === 'pro';

                            const accentBorder = isBeginner
                                ? 'rgba(16, 185, 129, 0.5)'
                                : isIntermediate
                                ? 'rgba(245, 158, 11, 0.5)'
                                : 'rgba(239, 68, 68, 0.5)';

                            return (
                                <div
                                    key={lvl.levelId}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: `2px solid ${accentBorder}`,
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '2rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: `0 10px 30px ${lvl.badgeBg}`,
                                        transition: 'all 0.25s ease'
                                    }}
                                >
                                    {/* Top Level Badge & Duration */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            padding: '0.25rem 0.65rem',
                                            borderRadius: 'var(--radius-full)',
                                            backgroundColor: lvl.badgeBg,
                                            color: lvl.color
                                        }}>
                                            {lvl.label}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={13} /> {lvl.duration}
                                        </span>
                                    </div>

                                    {/* Level Title */}
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                                        {lvl.title}
                                    </h3>
                                    <div style={{ fontSize: '0.8rem', color: lvl.color, fontWeight: 700, marginBottom: '1rem' }}>
                                        {lvl.audience}
                                    </div>

                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 1.25rem 0', flex: 1 }}>
                                        {lvl.description}
                                    </p>

                                    {/* The 3 Tasks Checklist Preview */}
                                    <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                            3 Sprint Tasks Included:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {lvl.tasks.map((task, tIdx) => (
                                                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.785rem', color: '#cbd5e1' }}>
                                                    <span style={{ fontWeight: 800, color: lvl.color }}>{tIdx + 1}.</span>
                                                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Select Level Button */}
                                    {(() => {
                                        const isLocked = !isVipBypass && (
                                            (lvl.levelId === 'intermediate' && !currentPlan.can_access_intermediate) ||
                                            (lvl.levelId === 'pro' && !currentPlan.can_access_pro)
                                        );
                                        return (
                                            <button
                                                onClick={() => handleSelectLevel(lvl.levelId)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.85rem 1.25rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: isLocked
                                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)'
                                                        : isBeginner
                                                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                                        : isIntermediate
                                                        ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                                                        : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                                    border: isLocked ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                                                    color: '#ffffff',
                                                    fontWeight: 800,
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    boxShadow: `0 4px 15px ${lvl.badgeBg}`
                                                }}
                                            >
                                                {isLocked && <Lock size={16} color="#f87171" />}
                                                <span>
                                                    {isLocked
                                                        ? `🔒 Unlock with ${lvl.levelId === 'intermediate' ? 'Premium (₹149/mo)' : 'Placement Pro (₹299/mo)'}`
                                                        : `Select ${lvl.label} & Review Tasks`
                                                    }
                                                </span>
                                                {!isLocked && <ArrowRight size={17} />}
                                            </button>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: SPRINT TASK REVIEW BRIEFING PAGE                                  */}
            {/* ========================================================================= */}
            {currentStep === 'review' && (
                <div>
                    {/* Top Back Action & Level Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <button
                            onClick={() => setCurrentStep('level')}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Difficulty Selection</span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Company: <strong>{selectedCompany.name}</strong>
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: selectedLevelData.badgeBg,
                                color: selectedLevelData.color
                            }}>
                                {selectedLevelData.label} Level
                            </span>
                        </div>
                    </div>

                    {/* The 3 Tasks Breakdown List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {selectedLevelData.tasks.map((task, idx) => {
                            const isSelected = activeReviewTaskIndex === idx;
                            return (
                                <div
                                    key={task.id}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1.75rem',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setActiveReviewTaskIndex(idx)}
                                >
                                    {/* Task Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                padding: '0.2rem 0.55rem',
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                                color: '#60a5fa'
                                            }}>
                                                Task {idx + 1}: {task.code}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FileCode size={13} color="#10b981" /> Target: <strong style={{ color: '#f8fafc' }}>{task.targetFile}</strong>
                                            </span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '0.15rem 0.45rem',
                                                borderRadius: '4px',
                                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                                color: '#38bdf8',
                                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                                fontWeight: 800,
                                                letterSpacing: '0.03em'
                                            }}>
                                                TS • PY • JAVA
                                            </span>
                                        </div>

                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Clock size={13} /> {task.duration}
                                        </span>
                                    </div>

                                    {/* Task Title */}
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
                                        {task.title}
                                    </h3>

                                    {/* Mission Scenario Context */}
                                    <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                        <strong style={{ color: '#f8fafc' }}>Business Scenario:</strong> {task.scenario}
                                    </p>

                                    {/* The 3 Required Changes Preview Box */}
                                    <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                            The 3 Changes Required In Your Code:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {task.the3Changes.map((changeStr, cIdx) => (
                                                <div key={cIdx} style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                                                    {changeStr}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Acceptance Criteria Checklist */}
                                    <div>
                                        <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                                            Definition of Done (Acceptance Criteria):
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            {task.acceptanceCriteria.map((crit, crIdx) => (
                                                <div key={crIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
                                                    <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                    <span>{crit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons: Interview Pitch Script & Quick Launch */}
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPitchModalTask(task);
                                                setCopiedPitch(false);
                                            }}
                                            style={{
                                                padding: '0.45rem 0.85rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(168, 85, 247, 0.12)',
                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                color: '#c084fc',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            <MessageSquare size={13} />
                                            <span>🎤 How to Pitch in Interview</span>
                                        </button>

                                        {(() => {
                                            const isTaskLocked = !isVipBypass && activePlanId === 'free' && task.code !== 'FIN-BEG-1';
                                            return (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLaunchIde(task.code);
                                                    }}
                                                    style={{
                                                        padding: '0.45rem 0.95rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: isTaskLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                        border: isTaskLocked ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(59, 130, 246, 0.3)',
                                                        color: isTaskLocked ? '#f87171' : '#60a5fa',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}
                                                >
                                                    {isTaskLocked ? <Lock size={13} color="#f87171" /> : <Play size={13} />}
                                                    <span>{isTaskLocked ? `Unlock ${task.code} with Premium` : `Open ${task.code} Directly in IDE`}</span>
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Sticky Action Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
                    }}>
                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                                Ready to write production code?
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                                You will have access to all 3 tasks inside the IDE with real-time test execution and AI Staff Engineer review.
                            </p>
                        </div>

                        <button
                            onClick={() => handleLaunchIde()}
                            style={{
                                padding: '0.95rem 1.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '1rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)'
                            }}
                        >
                            <Terminal size={18} />
                            <span>Launch Simulation IDE Now</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* FULL-SCREEN SIMULATION IDE MODAL                                          */}
            {/* ========================================================================= */}
            {showIdeLab && (
                <DeveloperSimulationLab
                    companyId={selectedCompanyId}
                    selectedLevel={selectedLevelId}
                    initialGuidedMode={selectedLevelId !== 'pro'}
                    initialTicketCode={ideInitialTicket}
                    onClose={() => setShowIdeLab(false)}
                />
            )}

            {/* ========================================================================= */}
            {/* INTERVIEW PITCH CHEATSHEET MODAL                                          */}
            {/* ========================================================================= */}
            {pitchModalTask && (() => {
                const pitch = getInterviewPitchForTask(pitchModalTask.code);
                const handleCopyScript = () => {
                    const fullText = `30-SECOND ELEVATOR PITCH:\n"${pitch.elevatorPitch}"\n\nSTAR FRAMEWORK:\n• Situation: ${pitch.starAnswer.situation}\n• Task: ${pitch.starAnswer.task}\n• Action: ${pitch.starAnswer.action}\n• Result: ${pitch.starAnswer.result}\n\nCOMMON INTERVIEWER GOTCHA:\nQ: ${pitch.interviewerQuestions?.[0]?.q}\nA: ${pitch.interviewerQuestions?.[0]?.a}`;
                    navigator.clipboard.writeText(fullText);
                    setCopiedPitch(true);
                    setTimeout(() => setCopiedPitch(false), 2500);
                };

                return (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1rem'
                    }} onClick={() => setPitchModalTask(null)}>
                        <div style={{
                            background: '#0f172a',
                            border: '1.5px solid #a855f7',
                            borderRadius: '16px',
                            maxWidth: '720px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: 'clamp(1.25rem, 3vw, 2rem)',
                            boxShadow: '0 25px 60px rgba(168, 85, 247, 0.3)',
                            position: 'relative'
                        }} onClick={(e) => e.stopPropagation()}>
                            
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        🎙️ Recruiter & System Design Pitch Script
                                    </span>
                                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
                                        How to Pitch {pitchModalTask.code} in Round 2
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setPitchModalTask(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Section 1: 30-Second Elevator Pitch */}
                            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e9d5ff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        ⚡ 30-Second Spoken Pitch (Word-for-Word)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyScript}
                                        style={{
                                            background: copiedPitch ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            padding: '0.25rem 0.65rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {copiedPitch ? <Check size={12} /> : <Copy size={12} />}
                                        <span>{copiedPitch ? 'Copied Full Script!' : 'Copy to Clipboard'}</span>
                                    </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc', lineHeight: 1.6, fontStyle: 'italic' }}>
                                    "{pitch.elevatorPitch}"
                                </p>
                            </div>

                            {/* Section 2: STAR Framework */}
                            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                                    📊 STAR Framework Breakdown
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
                                    <div><strong style={{ color: '#93c5fd' }}>Situation:</strong> <span style={{ color: '#cbd5e1' }}>{pitch.starAnswer.situation}</span></div>
                                    <div><strong style={{ color: '#93c5fd' }}>Task:</strong> <span style={{ color: '#cbd5e1' }}>{pitch.starAnswer.task}</span></div>
                                    <div><strong style={{ color: '#93c5fd' }}>Action:</strong> <span style={{ color: '#cbd5e1' }}>{pitch.starAnswer.action}</span></div>
                                    <div><strong style={{ color: '#4ade80' }}>Result:</strong> <span style={{ color: '#f8fafc', fontWeight: 600 }}>{pitch.starAnswer.result}</span></div>
                                </div>
                            </div>

                            {/* Section 3: Interviewer Gotcha Question */}
                            {pitch.interviewerQuestions?.[0] && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                                        🎯 Anticipated Interviewer Gotcha Question
                                    </div>
                                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.4rem' }}>
                                        Q: "{pitch.interviewerQuestions[0].q}"
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                        <strong style={{ color: '#34d399' }}>Your Winning Response:</strong> "{pitch.interviewerQuestions[0].a}"
                                    </div>
                                </div>
                            )}

                            {/* Close Button */}
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setPitchModalTask(null)}
                                    style={{
                                        padding: '0.6rem 1.4rem',
                                        borderRadius: '8px',
                                        background: '#a855f7',
                                        border: 'none',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
