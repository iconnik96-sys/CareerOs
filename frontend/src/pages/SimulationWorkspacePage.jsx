import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    ShieldCheck
} from 'lucide-react';
import { simulationService } from '../services/simulationService';
import { useToast } from '../contexts/ToastContext';
import { InconvenienceNotice } from '../components/common/InconvenienceNotice';

export const SimulationWorkspacePage = () => {
    const { trackKey } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [track, setTrack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trackError, setTrackError] = useState(null);

    // Active State
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('tickets'); // 'tickets' | 'standup' | 'architecture'
    const [selectedLanguage, setSelectedLanguage] = useState('python'); // 'python' | 'java' | 'node'
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);
    
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

    // Standup State
    const [standupForm, setStandupForm] = useState({
        yesterday: 'Finished reviewing the FinPulse architecture documentation and verified local development setup.',
        today: 'Implementing boundary currency validation and cents decimal constraints for ticket FIN-101.',
        blockers: 'None so far.'
    });
    const [standupLoading, setStandupLoading] = useState(false);
    const [standupResponse, setStandupResponse] = useState(null);

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
    const handleSubmitReview = async () => {
        const currentTicket = track?.tickets?.[activeTicketIndex];
        if (!currentTicket) return;

        if (submissionMode === 'IN_BROWSER' && (!editorCode || editorCode.trim().length < 20)) {
            toast?.error?.('Please write your implementation code before submitting.');
            return;
        }

        if (submissionMode === 'GITHUB_PR' && (!githubPrUrl || !githubPrUrl.includes('github.com'))) {
            toast?.error?.('Please enter a valid GitHub Pull Request URL.');
            return;
        }

        setReviewing(true);
        setReviewError(null);
        try {
            const res = await simulationService.submitReview({
                ticket_code: currentTicket.ticket_code,
                ticket_title: currentTicket.title,
                language: selectedLanguage,
                submission_mode: submissionMode,
                submitted_code: editorCode,
                github_pr_url: submissionMode === 'GITHUB_PR' ? githubPrUrl : null,
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

    // Daily Standup Submit
    const handleSendStandup = async (e) => {
        e.preventDefault();
        setStandupLoading(true);
        try {
            const currentTicket = track?.tickets?.[activeTicketIndex];
            const res = await simulationService.sendStandup({
                yesterday_work: standupForm.yesterday,
                today_plan: standupForm.today,
                blockers: standupForm.blockers,
                current_ticket: currentTicket?.ticket_code || 'FIN-101'
            });
            setStandupResponse(res);
            toast?.success?.('Standup update posted to Engineering Manager Sarah!');
        } catch (err) {
            toast?.error?.(err.message || 'Standup submission failed.');
        } finally {
            setStandupLoading(false);
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
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Top Navigation & Company Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => navigate('/simulations')}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.5rem', marginBottom: '0.75rem', fontSize: '0.8125rem' }}
                >
                    <ArrowLeft size={16} />
                    <span>Back to Simulations Catalog</span>
                </button>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(59, 130, 246, 0.25)'
                        }}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                                    {track?.company_name || 'FinPulse Global'}
                                </span>
                                <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                                    {track?.role_title || 'Junior Backend Engineer'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                Sprint 1 • Core Payments Squad • {track?.tickets?.length || 4} Production Tickets
                            </div>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                SPRINT COMPLETION
                            </div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {completedTickets.length} of {track?.tickets?.length || 4} Tickets Merged
                            </div>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'conic-gradient(var(--success) ' + ((completedTickets.length / (track?.tickets?.length || 4)) * 360) + 'deg, rgba(255,255,255,0.08) 0deg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800
                            }}>
                                {Math.round((completedTickets.length / (track?.tickets?.length || 4)) * 100)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs (Tickets, Standup, Architecture) */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
                paddingBottom: '0.25rem'
            }}>
                <button
                    onClick={() => setActiveWorkspaceTab('tickets')}
                    className={`btn-ghost ${activeWorkspaceTab === 'tickets' ? 'active' : ''}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        borderBottom: activeWorkspaceTab === 'tickets' ? '2px solid var(--primary)' : '2px solid transparent',
                        borderRadius: 0,
                        padding: '0.5rem 1rem',
                        color: activeWorkspaceTab === 'tickets' ? 'var(--primary)' : 'var(--text-secondary)'
                    }}
                >
                    <Code2 size={16} />
                    <span>Sprint Tickets ({track?.tickets?.length || 4})</span>
                </button>

                <button
                    onClick={() => setActiveWorkspaceTab('standup')}
                    className={`btn-ghost ${activeWorkspaceTab === 'standup' ? 'active' : ''}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        borderBottom: activeWorkspaceTab === 'standup' ? '2px solid var(--primary)' : '2px solid transparent',
                        borderRadius: 0,
                        padding: '0.5rem 1rem',
                        color: activeWorkspaceTab === 'standup' ? 'var(--primary)' : 'var(--text-secondary)'
                    }}
                >
                    <MessageSquare size={16} />
                    <span>Daily Standup with EM Sarah</span>
                </button>

                <button
                    onClick={() => setActiveWorkspaceTab('architecture')}
                    className={`btn-ghost ${activeWorkspaceTab === 'architecture' ? 'active' : ''}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        borderBottom: activeWorkspaceTab === 'architecture' ? '2px solid var(--primary)' : '2px solid transparent',
                        borderRadius: 0,
                        padding: '0.5rem 1rem',
                        color: activeWorkspaceTab === 'architecture' ? 'var(--primary)' : 'var(--text-secondary)'
                    }}
                >
                    <FileText size={16} />
                    <span>System Architecture Overview</span>
                </button>
            </div>

            {/* TAB 1: SPRINT TICKETS WORKSPACE */}
            {activeWorkspaceTab === 'tickets' && (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                    {/* Left Sidebar: Tickets List & Language Selector */}
                    <div>
                        {/* Tech Stack Dropdown */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Your Selected Stack
                            </label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="python">🐍 Python (FastAPI)</option>
                                <option value="java">☕ Java (Spring Boot)</option>
                                <option value="node">🟢 Node.js (Express)</option>
                            </select>
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                                Starter code & AI review will adapt to this stack.
                            </span>
                        </div>

                        {/* Tickets Navigation */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Sprint Backlog
                            </div>
                            <div>
                                {(track?.tickets || []).map((ticket, idx) => {
                                    const isCurrent = idx === activeTicketIndex;
                                    const isDone = completedTickets.includes(ticket.ticket_code);
                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => handleSelectTicket(idx)}
                                            style={{
                                                padding: '0.875rem 1rem',
                                                borderBottom: '1px solid var(--border-subtle)',
                                                cursor: 'pointer',
                                                background: isCurrent ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                                borderLeft: isCurrent ? '3px solid var(--primary)' : '3px solid transparent',
                                                transition: 'var(--transition-fast)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                        {ticket.ticket_code}
                                                    </span>
                                                    {ticket.ticket_type === 'FEATURE_DEV' ? (
                                                        <span style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 700 }}>
                                                            ✨ FEATURE
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', fontWeight: 600 }}>
                                                            BUG FIX
                                                        </span>
                                                    )}
                                                </div>
                                                {isDone ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'var(--success)', fontWeight: 700 }}>
                                                        <CheckCircle2 size={12} /> Merged
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                                        Ticket #{ticket.order_index}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                                {ticket.title}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Socratic Helper Card */}
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.06)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginTop: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#a5b4fc', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                                <HelpCircle size={15} />
                                <span>Stuck? Ask Senior Dev</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                                Marcus can provide a Socratic hint without spoiling the solution code.
                            </p>
                            <form onSubmit={handleAskMentor}>
                                <input
                                    type="text"
                                    placeholder="e.g. How do I acquire an atomic lock?"
                                    value={mentorQuestion}
                                    onChange={(e) => setMentorQuestion(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.4rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.5rem'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={mentorLoading}
                                    className="btn-secondary"
                                    style={{ width: '100%', fontSize: '0.75rem', padding: '0.375rem' }}
                                >
                                    {mentorLoading ? 'Asking Marcus...' : 'Ask for a Hint'}
                                </button>
                            </form>

                            {mentorHint && (
                                <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', borderLeft: '2px solid #a5b4fc' }}>
                                    <div style={{ fontWeight: 700, color: '#c7d2fe', marginBottom: '0.25rem' }}>
                                        💡 Marcus:
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                        {mentorHint.hint}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Active Ticket Details & Dual-Tab Submission */}
                    <div>
                        {currentTicket && (
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.5rem',
                                boxShadow: 'var(--shadow-md)',
                                marginBottom: '1.5rem'
                            }}>
                                {/* Ticket Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                                {currentTicket.ticket_code}
                                            </span>
                                            {currentTicket.ticket_type === 'FEATURE_DEV' ? (
                                                <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                                    ✨ Build Feature From Scratch
                                                </span>
                                            ) : (
                                                <span className="badge badge-gray" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                    🔧 Production Bug Fix
                                                </span>
                                            )}
                                        </div>
                                        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: '0.375rem 0 0', color: 'var(--text-primary)' }}>
                                            {currentTicket.title}
                                        </h2>
                                    </div>
                                    {completedTickets.includes(currentTicket.ticket_code) && (
                                        <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                                            <CheckCircle2 size={14} /> Approved & Merged
                                        </span>
                                    )}
                                </div>

                                {currentTicket.ticket_type === 'FEATURE_DEV' && (
                                    <div style={{
                                        background: 'rgba(168, 85, 247, 0.08)',
                                        border: '1px solid rgba(168, 85, 247, 0.25)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.875rem 1rem',
                                        marginBottom: '1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <Sparkles size={20} color="#c084fc" style={{ flexShrink: 0 }} />
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                            <strong>Feature Development Challenge:</strong> In this ticket, you are architecting a new API endpoint from scratch. Define the request schema, database lookup against the provided mock fixture, and business rule validations.
                                        </div>
                                    </div>
                                )}

                                {/* Business Context */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                                        Business Context
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {currentTicket.business_context}
                                    </p>
                                </div>

                                {/* Acceptance Criteria Checklist */}
                                <div style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <CheckCircle2 size={16} />
                                        <span>Acceptance Criteria (Definition of Done)</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                        {(currentTicket.acceptance_criteria || []).map((crit, cIdx) => (
                                            <div key={cIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>•</span>
                                                <span style={{ lineHeight: 1.4 }}>{crit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dual-Tab Submitter */}
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '1.25rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            How would you like to solve and submit this ticket?
                                        </div>
                                    </div>

                                    {/* Tabs Toggle */}
                                    <div style={{
                                        display: 'inline-flex',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.25rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <button
                                            onClick={() => setSubmissionMode('IN_BROWSER')}
                                            style={{
                                                padding: '0.4rem 0.875rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: 'none',
                                                background: submissionMode === 'IN_BROWSER' ? 'var(--primary)' : 'transparent',
                                                color: submissionMode === 'IN_BROWSER' ? '#fff' : 'var(--text-secondary)',
                                                fontWeight: 700,
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.375rem'
                                            }}
                                        >
                                            <Code2 size={14} />
                                            <span>Tab 1: In-Browser Editor (0 Setup)</span>
                                        </button>

                                        <button
                                            onClick={() => setSubmissionMode('GITHUB_PR')}
                                            style={{
                                                padding: '0.4rem 0.875rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: 'none',
                                                background: submissionMode === 'GITHUB_PR' ? 'var(--primary)' : 'transparent',
                                                color: submissionMode === 'GITHUB_PR' ? '#fff' : 'var(--text-secondary)',
                                                fontWeight: 700,
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.375rem'
                                            }}
                                        >
                                            <GitPullRequest size={14} />
                                            <span>Tab 2: Real GitHub PR Link</span>
                                        </button>
                                    </div>

                                    {/* TAB 1: In-Browser Editor */}
                                    {submissionMode === 'IN_BROWSER' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Write or edit your implementation code directly in the box below:
                                                </span>
                                                <button
                                                    onClick={handleResetStarterCode}
                                                    className="btn-ghost"
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                >
                                                    <RefreshCw size={12} />
                                                    <span>Reset Starter Code</span>
                                                </button>
                                            </div>

                                            <textarea
                                                value={editorCode}
                                                onChange={(e) => setEditorCode(e.target.value)}
                                                rows={15}
                                                style={{
                                                    width: '100%',
                                                    background: '#0d1117',
                                                    color: '#e6edf3',
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                    fontSize: '0.875rem',
                                                    padding: '1rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    resize: 'vertical',
                                                    lineHeight: 1.5,
                                                    marginBottom: '1rem',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* TAB 2: Real GitHub PR */}
                                    {submissionMode === 'GITHUB_PR' && (
                                        <div style={{
                                            background: 'rgba(0,0,0,0.15)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1.25rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                    Step 1: Create your private repository from our template
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                    Click below to generate a private repository on your personal GitHub account (no classmates can see it):
                                                </p>
                                                <a
                                                    href={`${templateRepoUrl}/generate`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-secondary"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.375rem',
                                                        fontSize: '0.8125rem',
                                                        padding: '0.4rem 0.75rem',
                                                        color: 'var(--primary)'
                                                    }}
                                                >
                                                    <span>📦 Create Private {selectedLanguage.toUpperCase()} Repo on GitHub</span>
                                                    <ExternalLink size={13} />
                                                </a>
                                            </div>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                    Step 2: Clone, create a branch, and open a Pull Request
                                                </div>
                                                <div style={{
                                                    background: '#0d1117',
                                                    padding: '0.625rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                    fontSize: '0.75rem',
                                                    color: '#7ee787'
                                                }}>
                                                    git clone &lt;your-private-repo-url&gt;<br />
                                                    cd finpulse-payments<br />
                                                    git checkout -b {currentTicket.ticket_code.toLowerCase()}-fix<br />
                                                    # Make your changes and commit<br />
                                                    git push origin {currentTicket.ticket_code.toLowerCase()}-fix
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                                                    Step 3: Paste your GitHub Pull Request URL
                                                </div>
                                                <input
                                                    type="url"
                                                    placeholder="https://github.com/your-username/finpulse-payments/pull/1"
                                                    value={githubPrUrl}
                                                    onChange={(e) => setGithubPrUrl(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        background: 'var(--bg-input)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'var(--text-primary)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        padding: '0.625rem',
                                                        fontSize: '0.875rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Action Button */}
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={reviewing}
                                        className="btn-primary"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            fontWeight: 800,
                                            fontSize: '0.9375rem'
                                        }}
                                    >
                                        {reviewing ? (
                                            <>
                                                <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                                                <span>Staff Engineer Marcus is reviewing your PR...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span>Run Senior Dev Code Review</span>
                                            </>
                                        )}
                                    </button>
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
            )}

            {/* TAB 2: DAILY STANDUP */}
            {activeWorkspaceTab === 'standup' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    maxWidth: '800px',
                    margin: '0 auto',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
                            <MessageSquare size={22} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Daily Asynchronous Standup
                            </h2>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                Checked by Sarah, Engineering Manager at FinPulse Global
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSendStandup}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                                1. What did you work on yesterday?
                            </label>
                            <textarea
                                value={standupForm.yesterday}
                                onChange={(e) => setStandupForm({ ...standupForm, yesterday: e.target.value })}
                                rows={3}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                                2. What are you tackling today?
                            </label>
                            <textarea
                                value={standupForm.today}
                                onChange={(e) => setStandupForm({ ...standupForm, today: e.target.value })}
                                rows={3}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                                3. Are there any blockers or obstacles?
                            </label>
                            <input
                                type="text"
                                value={standupForm.blockers}
                                onChange={(e) => setStandupForm({ ...standupForm, blockers: e.target.value })}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={standupLoading}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                        >
                            <Send size={16} />
                            <span>{standupLoading ? 'Posting Standup...' : 'Post Standup Update'}</span>
                        </button>
                    </form>

                    {standupResponse && (
                        <div style={{
                            marginTop: '2rem',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#60a5fa' }}>
                                    💬 Sarah (Engineering Manager):
                                </div>
                                <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                                    Communication: {standupResponse.communication_score}/100
                                </span>
                            </div>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                {standupResponse.manager_feedback}
                            </p>
                            {standupResponse.suggestions?.length > 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <strong>Communication Tips:</strong>
                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
                                        {standupResponse.suggestions.map((s, idx) => (
                                            <li key={idx}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: SYSTEM ARCHITECTURE OVERVIEW */}
            {activeWorkspaceTab === 'architecture' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem' }}>
                        FinPulse Core Architecture Document
                    </h2>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                        <p>
                            FinPulse operates a high-throughput, distributed payment processing cluster. Every transaction must be validated within 15 milliseconds, verified against an idempotency lock to prevent double-spending, and logged with sanitized audit trails.
                        </p>
                        
                        <div style={{
                            background: '#0d1117',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.8125rem',
                            color: '#79c0ff',
                            margin: '1.5rem 0'
                        }}>
                            [Merchant API Client] ➔ [API Gateway / Currency Validation (FIN-101)]<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Distributed Redis Idempotency Lock (FIN-102)]<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Core Ledger Service / Card Processor]<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Structured Error & Audit Middleware (FIN-103)]
                        </div>

                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.5rem 0 0.5rem' }}>
                            Engineering Standards at FinPulse:
                        </h3>
                        <ul>
                            <li><strong>Defensive Programming:</strong> Never assume the client sends valid ISO currency codes or positive integers.</li>
                            <li><strong>Concurrency Safety:</strong> High traffic means two requests can execute within the exact same millisecond. Use atomic distributed locks.</li>
                            <li><strong>Security & Compliance:</strong> Never log raw credit card numbers or CVVs. Sanitize all exception outputs so database credentials are never revealed to clients.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
