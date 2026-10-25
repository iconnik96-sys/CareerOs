import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Terminal, 
    ArrowLeft, 
    Building2, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Send, 
    Sparkles, 
    GitPullRequest, 
    Code2, 
    AlertCircle, 
    HelpCircle, 
    Copy, 
    Check, 
    ExternalLink, 
    RefreshCw, 
    MessageSquare, 
    FileText, 
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ShieldCheck
} from 'lucide-react';
import { simulationService } from '../services/simulationService';
import { profileService } from '../services/profileService';
import { calculateCareerReadiness } from '../utils/careerRoles';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { InconvenienceNotice } from '../components/common/InconvenienceNotice';
import { DeveloperSimulationLab } from '../components/simulation/DeveloperSimulationLab';

export const SimulationWorkspacePage = () => {
    const { trackKey } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const { user, profile } = useAuth();

    const [track, setTrack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trackError, setTrackError] = useState(null);

    // Active State
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('tickets'); // 'tickets' | 'architecture'
    const [selectedLanguage, setSelectedLanguage] = useState('python'); // 'python' | 'java' | 'node'
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);
    const [showIdeLab, setShowIdeLab] = useState(searchParams.get('mode') === 'ide');
    const [showHintAccordion, setShowHintAccordion] = useState(false);
    const [showArchAccordion, setShowArchAccordion] = useState(false);
    
    // Submission Mode State
    const [submissionMode, setSubmissionMode] = useState('IN_BROWSER'); // 'IN_BROWSER' | 'GITHUB_PR'
    const [editorCode, setEditorCode] = useState('');
    const [githubPrUrl, setGithubPrUrl] = useState('');
    const [reviewing, setReviewing] = useState(false);
    const [reviewResult, setReviewResult] = useState(null);
    const [reviewError, setReviewError] = useState(null);
    const [attempts, setAttempts] = useState(1);
    const [copiedBullet, setCopiedBullet] = useState(false);

    // Progressive hints
    const [showHint, setShowHint] = useState(false);

    // Socratic Hint State
    const [mentorQuestion, setMentorQuestion] = useState('');
    const [mentorLoading, setMentorLoading] = useState(false);
    const [mentorHint, setMentorHint] = useState(null);

    // Completed tickets tracker
    const [completedTickets, setCompletedTickets] = useState([]);

    useEffect(() => {
        loadTrackData();
    }, [trackKey]);

    const loadTrackData = async () => {
        setLoading(true);
        setTrackError(null);
        try {
            const data = await simulationService.getTrack(trackKey || 'finpulse-payments');
            setTrack(data);
            
            // Load saved local progress
            const saved = simulationService.getProgress(trackKey || 'finpulse-payments');
            if (saved?.selectedLanguage) setSelectedLanguage(saved.selectedLanguage);
            if (saved?.completedTickets) setCompletedTickets(saved.completedTickets);

            // Set initial starter code
            if (data?.tickets?.[0]) {
                updateStarterCode(data.tickets[0], saved?.selectedLanguage || 'python');
            }
        } catch (err) {
            console.error('Failed to load track data', err);
            setTrack(null);
            setTrackError(err.message || 'Simulation track could not be loaded from backend.');
            toast?.error?.('Simulation track service is currently unavailable.');
        } finally {
            setLoading(false);
        }
    };

    const updateStarterCode = (ticket, lang) => {
        if (!ticket) return;
        let code = '';
        if (lang === 'python') code = ticket.starter_code_python || '';
        else if (lang === 'java') code = ticket.starter_code_java || '';
        else if (lang === 'node') code = ticket.starter_code_node || '';
        setEditorCode(code);
    };

    const handleLanguageChange = (newLang) => {
        setSelectedLanguage(newLang);
        if (track?.tickets?.[activeTicketIndex]) {
            updateStarterCode(track.tickets[activeTicketIndex], newLang);
        }
        setReviewResult(null);
        simulationService.saveProgress(trackKey, {
            selectedLanguage: newLang,
            completedTickets
        });
    };

    const handleSelectTicket = (index) => {
        setActiveTicketIndex(index);
        setReviewResult(null);
        setShowHint(false);
        if (track?.tickets?.[index]) {
            updateStarterCode(track.tickets[index], selectedLanguage);
        }
    };

    const handleResetStarterCode = () => {
        if (track?.tickets?.[activeTicketIndex]) {
            updateStarterCode(track.tickets[activeTicketIndex], selectedLanguage);
            toast?.info?.('Starter code reset to default template.');
        }
    };

    // Run AI Code Review
    const handleSubmitReview = async (overridePayload) => {
        const currentTicket = track?.tickets?.[activeTicketIndex];
        if (!currentTicket) return;

        const submittedCode = typeof overridePayload === 'string'
            ? overridePayload
            : (overridePayload?.submitted_code || editorCode);

        if (!submittedCode || submittedCode.trim().length < 10) {
            toast?.error?.('Please make code changes in the WASM Simulation Lab before submitting.');
            return;
        }

        setReviewing(true);
        setReviewError(null);
        try {
            const res = await simulationService.submitReview({
                ticket_code: currentTicket.ticket_code,
                ticket_title: currentTicket.title,
                language: selectedLanguage,
                submission_mode: 'IN_BROWSER',
                submitted_code: submittedCode,
                acceptance_criteria: currentTicket.acceptance_criteria || [],
                attempt_number: attempts
            });

            setReviewResult(res);
            setAttempts(prev => prev + 1);

            if (res.status === 'APPROVED') {
                toast?.success?.(`Ticket ${currentTicket.ticket_code} Approved by Marcus! 🎉`);
                if (!completedTickets.includes(currentTicket.ticket_code)) {
                    const updated = [...completedTickets, currentTicket.ticket_code];
                    setCompletedTickets(updated);
                    simulationService.saveProgress(trackKey, {
                        selectedLanguage,
                        completedTickets: updated
                    });

                    // Sync updated Career Readiness score to Supabase
                    try {
                        const uid = user?.id || profile?.user_id;
                        if (uid) {
                            const newScore = calculateCareerReadiness([], profile?.target_role || 'Software Engineer', profile, {
                                simulationProgress: { completedTickets: updated },
                                hasResume: Boolean(profile?.resume_url)
                            });
                            profileService.updateProfile(uid, { career_readiness: newScore });
                        }
                    } catch (syncErr) {
                        console.warn('Could not auto-sync simulation readiness to Supabase:', syncErr);
                    }
                }
            } else {
                toast?.warning?.('Staff Engineer Marcus requested revisions. Review feedback below.');
            }
        } catch (err) {
            console.error('Review failed', err);
            setReviewResult(null);
            setReviewError(err.message || 'AI code review service is currently unavailable.');
            toast?.error?.('Review failed. The AI backend is unavailable.');
        } finally {
            setReviewing(false);
        }
    };


    // Ask Mentor Hint Submit
    const handleAskMentor = async (e) => {
        e.preventDefault();
        if (!mentorQuestion.trim()) return;
        setMentorLoading(true);
        try {
            const currentTicket = track?.tickets?.[activeTicketIndex];
            const res = await simulationService.askMentorHint({
                ticket_code: currentTicket?.ticket_code || 'FIN-101',
                language: selectedLanguage,
                current_code: editorCode,
                question: mentorQuestion
            });
            setMentorHint(res);
        } catch (err) {
            toast?.error?.(err.message || 'Could not fetch mentor hint.');
        } finally {
            setMentorLoading(false);
        }
    };

    const handleCopyBullet = (bulletText) => {
        navigator.clipboard.writeText(bulletText);
        setCopiedBullet(true);
        toast?.success?.('STAR Resume bullet copied to clipboard!');
        setTimeout(() => setCopiedBullet(false), 2500);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loading-spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    if (!track) {
        return (
            <div style={{ maxWidth: 'var(--container-max)', margin: '2rem auto', padding: '1rem' }}>
                <InconvenienceNotice
                    title="Simulation Track Unavailable"
                    message="We are sorry for the inconvenience. The workplace simulation track could not be loaded from the backend. We have disabled unverified mock data to prevent incorrect feedback."
                    details={trackError}
                    onRetry={loadTrackData}
                    retryText="Retry Loading Workspace"
                    secondaryActionText="Back to Catalog"
                    onSecondaryAction={() => navigate('/simulations')}
                />
            </div>
        );
    }

    const currentTicket = track?.tickets?.[activeTicketIndex];
    const templateRepoUrl = track?.github_templates?.[selectedLanguage] || 'https://github.com/CareerOS-HQ/finpulse-payments-python';

    return (
        <div className="page-container" style={{ padding: '1.5rem 2.5rem 4rem 2.5rem', maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {/* Top Navigation & Stepper Header */}
            <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Left: Company & Role */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <button 
                            onClick={() => navigate('/simulations')}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.65rem', fontSize: '0.8125rem' }}
                            title="Back to Simulations Catalog"
                        >
                            <ArrowLeft size={16} />
                            <span>Catalog</span>
                        </button>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                            <Building2 size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                    {track?.company_name || 'FinPulse Payments'}
                                </span>
                                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                                    {track?.role_title || 'Junior Backend Engineer'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Sprint 1 • Core Payments Squad
                            </div>
                        </div>
                    </div>

                    {/* Center: 3-Step Guided Stepper */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9999px',
                        padding: '0.25rem',
                        gap: '0.25rem'
                    }}>
                        {/* Step 1: Understand Ticket (Active) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#93c5fd',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                            <span>1. Understand Ticket</span>
                        </div>

                        {/* Step 2: Code in IDE */}
                        <button
                            onClick={() => setShowIdeLab(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '9999px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <Terminal size={12} />
                            <span>2. Code & Test in IDE</span>
                        </button>

                        {/* Step 3: Staff PR Review */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            <GitPullRequest size={12} />
                            <span>3. Staff PR Review</span>
                        </div>
                    </div>

                    {/* Right: Stack Selector & Progress Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.35rem 0.75rem',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="python">🐍 Python (FastAPI)</option>
                            <option value="java">☕ Java (Spring Boot)</option>
                            <option value="node">🟢 Node.js (Express)</option>
                        </select>

                        <div style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}>
                            <CheckCircle2 size={13} />
                            <span>{completedTickets.length} of {track?.tickets?.length || 4} Merged</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main 2-Column Layout: Sprint Backlog + Active Ticket */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Left Column: Sprint Backlog */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ 
                        padding: '1rem 1.25rem', 
                        borderBottom: '1px solid var(--border-color)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            Sprint Backlog
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {track?.tickets?.length || 4} Tickets
                        </span>
                    </div>

                    <div style={{ padding: '0.5rem' }}>
                        {(track?.tickets || []).map((ticket, idx) => {
                            const isCurrent = idx === activeTicketIndex;
                            const isDone = completedTickets.includes(ticket.ticket_code);
                            return (
                                <div
                                    key={ticket.id || idx}
                                    onClick={() => handleSelectTicket(idx)}
                                    style={{
                                        padding: '0.75rem 0.875rem',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '0.25rem',
                                        cursor: 'pointer',
                                        background: isCurrent ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                                        border: isCurrent ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ 
                                            fontWeight: 800, 
                                            fontSize: '0.75rem', 
                                            color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' 
                                        }}>
                                            {ticket.ticket_code}
                                        </span>
                                        {isDone ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'var(--success)', fontWeight: 700 }}>
                                                <CheckCircle2 size={13} /> Merged
                                            </span>
                                        ) : isCurrent ? (
                                            <span style={{ fontSize: '0.6875rem', color: '#60a5fa', fontWeight: 700 }}>
                                                Active
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.8125rem', 
                                        fontWeight: isCurrent ? 700 : 500, 
                                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        lineHeight: 1.35
                                    }}>
                                        {ticket.title}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Footer */}
                    <div style={{
                        padding: '0.75rem 1.25rem',
                        borderTop: '1px solid var(--border-color)',
                        background: 'rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                            <span>SPRINT PROGRESS</span>
                            <span>{Math.round((completedTickets.length / (track?.tickets?.length || 4)) * 100)}%</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(completedTickets.length / (track?.tickets?.length || 4)) * 100}%`,
                                height: '100%',
                                background: 'var(--success)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Ticket Briefing */}
                <div>
                    {currentTicket && (
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.75rem',
                            boxShadow: 'var(--shadow-md)',
                            marginBottom: '1.5rem'
                        }}>
                            {/* Ticket Badges & Title */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                        {currentTicket.ticket_code}
                                    </span>
                                    {currentTicket.ticket_type === 'FEATURE_DEV' ? (
                                        <span className="badge badge-purple" style={{ fontSize: '0.6875rem', fontWeight: 700 }}>
                                            ✨ Feature Development
                                        </span>
                                    ) : (
                                        <span className="badge badge-gray" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                                            🔧 Production Bug Fix
                                        </span>
                                    )}
                                </div>
                                {completedTickets.includes(currentTicket.ticket_code) && (
                                    <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                                        <CheckCircle2 size={14} /> Approved & Merged
                                    </span>
                                )}
                            </div>

                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                Ticket {currentTicket.order_index}: {currentTicket.title}
                            </h1>

                            {/* Mission Summary */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    Mission Summary
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {currentTicket.business_context}
                                </p>
                            </div>

                            {/* Checklist / Acceptance Criteria */}
                            <div style={{ marginBottom: '1.75rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                                    Checklist (Definition of Done)
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {(currentTicket.acceptance_criteria || []).map((crit, cIdx) => (
                                        <div key={cIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ lineHeight: 1.45 }}>{crit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Full-Width Hero CTA Button */}
                            <button
                                onClick={() => setShowIdeLab(true)}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.95rem 1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.625rem',
                                    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginBottom: '1rem'
                                }}
                            >
                                <Terminal size={18} />
                                <span>Start Coding in Simulation IDE</span>
                                <ChevronRight size={18} />
                            </button>

                            {/* Accordion 1: Stuck? Ask Senior Dev Marcus */}
                            <div style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                marginBottom: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.1)'
                            }}>
                                <button
                                    onClick={() => setShowHintAccordion(prev => !prev)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        color: '#cbd5e1',
                                        fontWeight: 700,
                                        fontSize: '0.8125rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <HelpCircle size={15} color="#818cf8" />
                                        <span>Stuck? Ask Senior Dev Marcus for a Hint</span>
                                    </div>
                                    {showHintAccordion ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>

                                {showHintAccordion && (
                                    <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
                                        <p style={{ margin: '0.5rem 0 0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Marcus can provide a Socratic architectural hint without spoiling the solution code.
                                        </p>
                                        <form onSubmit={handleAskMentor} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="e.g. How do I acquire an atomic lock in Redis?"
                                                value={mentorQuestion}
                                                onChange={(e) => setMentorQuestion(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    background: 'var(--bg-input)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: '0.5rem 0.75rem',
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none'
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={mentorLoading}
                                                className="btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', flexShrink: 0 }}
                                            >
                                                {mentorLoading ? 'Asking...' : 'Get Hint'}
                                            </button>
                                        </form>

                                        {mentorHint && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #818cf8', fontSize: '0.8125rem' }}>
                                                <div style={{ fontWeight: 800, color: '#c7d2fe', marginBottom: '0.25rem' }}>
                                                    💡 Marcus:
                                                </div>
                                                <div style={{ color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                                    {mentorHint.hint}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: System Architecture Overview */}
                            <div style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                background: 'rgba(0, 0, 0, 0.1)'
                            }}>
                                <button
                                    onClick={() => setShowArchAccordion(prev => !prev)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        color: '#cbd5e1',
                                        fontWeight: 700,
                                        fontSize: '0.8125rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={15} color="#38bdf8" />
                                        <span>System Architecture Overview</span>
                                    </div>
                                    {showArchAccordion ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>

                                {showArchAccordion && (
                                    <div style={{ padding: '0.75rem 1rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
                                        <div style={{
                                            background: '#0d1117',
                                            padding: '0.875rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize: '0.75rem',
                                            color: '#79c0ff',
                                            lineHeight: 1.6
                                        }}>
                                            [Merchant API Client] ➔ [API Gateway / Validation (FIN-101)]<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Distributed Redis Lock (FIN-102)]<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Core Ledger Service / Card Processor]<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Error & Audit Middleware (FIN-103)]
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                        {/* AI REVIEW ERROR NOTICE */}
                        {reviewError && (
                            <InconvenienceNotice
                                title="AI Code Review Unavailable"
                                message="We are sorry for the inconvenience. Our automated Senior Developer code review service could not be reached to evaluate your pull request. To guarantee accurate grading, mock evaluations and fake scores have been disabled."
                                details={reviewError}
                                onRetry={handleSubmitReview}
                                retryText="Retry Code Review"
                            />
                        )}

                        {/* REVIEW FEEDBACK RESULTS PANEL */}
                        {reviewResult && (
                            <div style={{
                                background: 'var(--bg-card)',
                                border: reviewResult.status === 'APPROVED' ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.75rem',
                                boxShadow: 'var(--shadow-lg)',
                                marginBottom: '2rem',
                                position: 'relative'
                            }}>
                                {/* Decision Badge Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {reviewResult.status === 'APPROVED' ? (
                                            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                                                <CheckCircle2 size={24} />
                                            </div>
                                        ) : (
                                            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                                                <XCircle size={24} />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{
                                                fontSize: '1.125rem',
                                                fontWeight: 800,
                                                color: reviewResult.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {reviewResult.status === 'APPROVED' ? 'PULL REQUEST APPROVED & MERGED' : 'CHANGES REQUESTED BY MARCUS'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Attempt #{attempts - 1} • Reviewed by Marcus, Staff Software Engineer
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: reviewResult.score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                                            {reviewResult.score}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Unchanged Code or Unmodified Template Alert */}
                                {reviewResult.is_unchanged_attempt && (
                                    <div style={{
                                        background: 'rgba(245, 158, 11, 0.12)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.75rem 1rem',
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.8125rem',
                                        color: '#fbbf24'
                                    }}>
                                        <AlertCircle size={16} />
                                        <span>
                                            <strong>No Code Changes Detected:</strong> You re-submitted the exact same code. Your score remains strictly locked at <strong>{reviewResult.score}/100</strong>. Modify your code to fix the failing criteria below.
                                        </span>
                                    </div>
                                )}

                                {reviewResult.is_unmodified_starter && (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.75rem 1rem',
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.8125rem',
                                        color: '#f87171'
                                    }}>
                                        <AlertCircle size={16} />
                                        <span>
                                            <strong>Unmodified Starter Code:</strong> You submitted the initial starter template without implementing the required logic. Please replace the TODO comments with working code.
                                        </span>
                                    </div>
                                )}

                                {/* Marcus Summary */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                                        Senior Dev Summary
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.15)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                                        {reviewResult.summary}
                                    </p>
                                </div>

                                {/* Acceptance Criteria Rubric Breakdown */}
                                {reviewResult.criteria_breakdown && reviewResult.criteria_breakdown.length > 0 && (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Acceptance Criteria Rubric Breakdown
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {reviewResult.criteria_breakdown.filter(c => c.status === 'PASS').length} of {reviewResult.criteria_breakdown.length} Criteria Passed
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {reviewResult.criteria_breakdown.map((crit, idx) => (
                                                <div key={idx} style={{
                                                    background: crit.status === 'PASS' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                                                    border: crit.status === 'PASS' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: '0.75rem 1rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    gap: '1rem'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                            {crit.status === 'PASS' ? (
                                                                <CheckCircle2 size={16} color="var(--success)" />
                                                            ) : (
                                                                <XCircle size={16} color="var(--danger)" />
                                                            )}
                                                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                                                {crit.criterion}
                                                            </span>
                                                        </div>
                                                        {crit.feedback && (
                                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: 1.4 }}>
                                                                {crit.feedback}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{
                                                        fontWeight: 800,
                                                        fontSize: '0.8125rem',
                                                        color: crit.status === 'PASS' ? 'var(--success)' : 'var(--danger)',
                                                        background: crit.status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {crit.points_awarded} / {crit.points_possible} pts
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Strengths & Improvements */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>
                                            ✓ Strengths
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            {(reviewResult.strengths || []).map((s, i) => (
                                                <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
                                            ⚠ Items to Address
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            {(reviewResult.improvements || []).map((imp, i) => (
                                                <li key={i} style={{ marginBottom: '0.25rem' }}>{imp}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Line Comments */}
                                {reviewResult.line_comments && reviewResult.line_comments.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Inline Code Comments
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {reviewResult.line_comments.map((lc, idx) => (
                                                <div key={idx} style={{
                                                    background: '#0d1117',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: '0.75rem',
                                                    fontSize: '0.8125rem'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        {lc.line && (
                                                            <span className="badge badge-gray" style={{ fontSize: '0.6875rem', fontFamily: 'JetBrains Mono' }}>
                                                                Line {lc.line}
                                                            </span>
                                                        )}
                                                        <span className={`badge ${lc.severity === 'blocker' ? 'badge-red' : lc.severity === 'praise' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.6875rem' }}>
                                                            {lc.severity.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div style={{ color: '#e6edf3', lineHeight: 1.4 }}>
                                                        {lc.comment}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Earned Resume Bullet (STAR Formula) */}
                                {reviewResult.star_bullet && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#60a5fa', fontWeight: 700, fontSize: '0.8125rem' }}>
                                                <Sparkles size={15} />
                                                <span>Earned Google XYZ Resume Bullet Point</span>
                                            </div>
                                            <button
                                                onClick={() => handleCopyBullet(reviewResult.star_bullet)}
                                                className="btn-ghost"
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                {copiedBullet ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                                                <span>{copiedBullet ? 'Copied!' : 'Copy Bullet'}</span>
                                            </button>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                            "{reviewResult.star_bullet}"
                                        </p>
                                    </div>
                                )}

                                {/* Interview Talking Point */}
                                {reviewResult.interview_talking_point && (
                                    <div style={{
                                        background: 'rgba(0,0,0,0.15)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.875rem'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                            How to Talk About This in Real Interviews:
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            {reviewResult.interview_talking_point}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            {/* FULL-SCREEN DEVELOPER SIMULATION LAB (WASM WORKSTATION) */}
            {showIdeLab && (
                <DeveloperSimulationLab
                    track={track}
                    activeTicket={track?.tickets?.[activeTicketIndex]}
                    onClose={() => setShowIdeLab(false)}
                    onSubmitReview={handleSubmitReview}
                    reviewing={reviewing}
                    reviewResult={reviewResult}
                />
            )}
        </div>
    );
};
