import React, { useState, useMemo, useEffect } from 'react';
import {
    Sparkles, CheckCircle2, AlertTriangle, XCircle, ChevronDown,
    ChevronUp, RefreshCw, Plus, Zap, Award, Target,
    Check, ArrowRight, ShieldCheck, FileText, Cpu, AlertCircle
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CircularProgress } from '../common/CircularProgress';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
    runLiveAtsCheck,
    isResumeBuildable,
    buildStarterAtsResume,
    serializeResumeToText
} from '../../utils/atsResumeChecker';
import { aiFastApiService } from '../../services/aiFastApiService';

const ROLE_OPTIONS = [
    'Java Backend Developer',
    'Backend Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'AI/ML Engineer',
    'DevOps Engineer',
    'Cybersecurity Specialist'
];

export const LiveAtsChecker = ({
    resumeData,
    setResumeData,
    targetRole = 'Java Backend Developer',
    onTargetRoleChange,
    showToast
}) => {
    const [selectedRole, setSelectedRole] = useState(targetRole || 'Java Backend Developer');
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'issues' | 'keywords' | 'ai_deep'
    const [aiDeepLoading, setAiDeepLoading] = useState(false);
    const [aiDeepResult, setAiDeepResult] = useState(null);
    const [aiError, setAiError] = useState(null);

    // Sync role changes
    const handleRoleChange = (newRole) => {
        setSelectedRole(newRole);
        if (onTargetRoleChange) onTargetRoleChange(newRole);
        if (showToast) showToast(`Target role switched to ${newRole}`, 'info');
    };

    // 1. Check buildability
    const buildableStatus = useMemo(() => {
        return isResumeBuildable(resumeData);
    }, [resumeData]);

    // 2. Real deterministic live ATS check
    const atsAudit = useMemo(() => {
        return runLiveAtsCheck(resumeData, selectedRole);
    }, [resumeData, selectedRole]);

    // Persist real-time live ATS score so Dashboard and Career Readiness are in 100% sync
    useEffect(() => {
        if (typeof atsAudit?.totalScore === 'number') {
            try {
                localStorage.setItem('careeros_live_ats_score', JSON.stringify({
                    score: atsAudit.totalScore,
                    grade: atsAudit.grade,
                    rating: atsAudit.atsRating,
                    role: selectedRole,
                    updatedAt: new Date().toISOString()
                }));
            } catch (e) {
                // Ignore storage errors
            }
        }
    }, [atsAudit?.totalScore, atsAudit?.grade, atsAudit?.atsRating, selectedRole]);

    // Handler to create / populate a full buildable ATS resume
    const handleCreateBuildableResume = () => {
        const starter = buildStarterAtsResume(selectedRole, {
            full_name: resumeData?.personal?.fullName || '',
            email: resumeData?.personal?.email || ''
        });
        setResumeData(starter);
        if (showToast) {
            showToast(`Generated high-impact ATS resume template for ${selectedRole}!`, 'success');
        }
    };

    // Handler to add a missing skill to the resume skills categories with 1 click
    const handleAddMissingSkill = (skillName) => {
        setResumeData(prev => {
            const categories = [...(prev.skills?.categories || [])];
            if (categories.length === 0) {
                categories.push({ name: 'Technical Skills', items: skillName });
            } else {
                // Add to first category or primary category
                const first = { ...categories[0] };
                const currentItems = first.items ? first.items.split(',').map(s => s.trim()).filter(Boolean) : [];
                if (!currentItems.some(i => i.toLowerCase() === skillName.toLowerCase())) {
                    currentItems.push(skillName);
                    first.items = currentItems.join(', ');
                    categories[0] = first;
                }
            }
            return {
                ...prev,
                skills: { ...prev.skills, categories }
            };
        });
        if (showToast) {
            showToast(`Added "${skillName}" to technical skills!`, 'success');
        }
    };

    // Handler to run Deep AI ATS Analysis via FastAPI / Groq
    const handleRunDeepAiAudit = async () => {
        const plainText = serializeResumeToText(resumeData);
        if (!plainText || plainText.length < 20) {
            if (showToast) showToast('Resume content is too short for AI analysis.', 'warning');
            return;
        }

        setAiDeepLoading(true);
        setAiError(null);
        setActiveTab('ai_deep');
        setIsExpanded(true);

        try {
            const result = await aiFastApiService.deepResumeAnalysis({
                resume_text: plainText,
                target_role: selectedRole,
                job_description: `Targeting competitive ${selectedRole} opportunities at top tech organizations.`
            });
            setAiDeepResult(result);
            if (showToast) {
                showToast(`Deep AI ATS Audit completed! Match score: ${result.match_score}/100`, 'success');
            }
        } catch (err) {
            console.error('Deep AI ATS analysis error:', err);
            const msg = err?.message || 'Failed to connect to AI engine for deep analysis.';
            setAiError(msg);
            if (showToast) showToast(msg, 'error');
        } finally {
            setAiDeepLoading(false);
        }
    };

    const scoreColor = atsAudit.totalScore >= 80 ? 'var(--success)' : (atsAudit.totalScore >= 60 ? 'var(--warning)' : 'var(--danger)');

    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            marginBottom: '1.25rem'
        }}>
            {/* Top Bar: Always Visible Live Score Header */}
            <div style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)'
            }}>
                {/* Score & Gauge Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px' }}>
                    <CircularProgress
                        value={buildableStatus.isBuildable ? atsAudit.totalScore : buildableStatus.completionPercentage}
                        size={56}
                        strokeWidth={5}
                        color={buildableStatus.isBuildable ? (atsAudit.totalScore >= 80 ? 'success' : (atsAudit.totalScore >= 60 ? 'warning' : 'danger')) : 'neutral'}
                        showLabel={false}
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1
                        }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: scoreColor }}>
                                {buildableStatus.isBuildable ? atsAudit.totalScore : `${buildableStatus.completionPercentage}%`}
                            </span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px', letterSpacing: '0.5px' }}>
                                {buildableStatus.isBuildable ? 'ATS' : 'BUILD'}
                            </span>
                        </div>
                    </CircularProgress>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Live ATS Score
                            </span>
                            {buildableStatus.isBuildable ? (
                                <span className={`badge badge-${atsAudit.badgeColor}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                                    {atsAudit.grade} • {atsAudit.atsRating}
                                </span>
                            ) : (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                                    ⚠️ Incomplete / Not Buildable
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>
                                <strong>{atsAudit.passedCount}</strong>/{atsAudit.totalChecks || 16} Checks Passed
                            </span>
                            <span>•</span>
                            <span>
                                <strong>{atsAudit.wordCount}</strong> Words
                            </span>
                            <span>•</span>
                            <span style={{ color: atsAudit.matchedSkills.length >= 6 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                                {atsAudit.matchedSkills.length} Role Skills
                            </span>
                        </div>
                    </div>
                </div>

                {/* Target Role Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Target size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        Target Role:
                    </span>
                    <select
                        value={selectedRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="form-input"
                        style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            height: '32px',
                            minWidth: '180px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        {ROLE_OPTIONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!buildableStatus.isBuildable ? (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCreateBuildableResume}
                            leftIcon={<Sparkles size={14} />}
                        >
                            Build ATS Resume
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRunDeepAiAudit}
                            disabled={aiDeepLoading}
                            leftIcon={aiDeepLoading ? <LoadingSpinner size="xs" /> : <Sparkles size={14} />}
                            title="Run Deep LLM Analysis via FastAPI backend"
                        >
                            {aiDeepLoading ? 'Analyzing...' : 'Deep AI Audit'}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(prev => !prev)}
                        rightIcon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {isExpanded ? 'Hide Checklist' : 'View Checklist'}
                    </Button>
                </div>
            </div>

            {/* If Resume is NOT Buildable: Clear Prominent Action Banner */}
            {!buildableStatus.isBuildable && (
                <div style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Resume Missing Critical Content ({buildableStatus.completionPercentage}% Buildable)
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {buildableStatus.reasons.join(' ')} An Applicant Tracking System will reject empty or incomplete applications.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCreateBuildableResume}
                        leftIcon={<Sparkles size={14} />}
                    >
                        ✨ Create & Fill ATS-Ready Resume
                    </Button>
                </div>
            )}

            {/* Quick Micro-Metrics Bar (Visual Hierarchy: warnings in amber, good in quiet muted green) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1px',
                backgroundColor: 'var(--border-subtle)',
                borderTop: '1px solid var(--border-subtle)'
            }}>
                {/* 1. Role Match */}
                {(() => {
                    const isGood = (atsAudit.matchedSkills.length / (atsAudit.totalRoleSkills || 1)) >= 0.6;
                    return (
                        <div style={{
                            padding: '0.55rem 0.75rem',
                            backgroundColor: isGood ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                            textAlign: 'center',
                            transition: 'background-color 0.2s ease'
                        }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                                Role Match
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isGood ? 'var(--success)' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                {isGood ? <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={12} style={{ color: '#f59e0b' }} />}
                                <span>{atsAudit.matchedSkills.length} / {atsAudit.totalRoleSkills || 10} Skills</span>
                            </div>
                        </div>
                    );
                })()}

                {/* 2. STAR Metrics */}
                {(() => {
                    const isGood = atsAudit.metricsStats.percentage >= 40;
                    return (
                        <div style={{
                            padding: '0.55rem 0.75rem',
                            backgroundColor: isGood ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                            textAlign: 'center',
                            transition: 'background-color 0.2s ease'
                        }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                                STAR Metrics
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isGood ? 'var(--success)' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                {isGood ? <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={12} style={{ color: '#f59e0b' }} />}
                                <span>{atsAudit.metricsStats.percentage}% of Bullets</span>
                            </div>
                        </div>
                    );
                })()}

                {/* 3. Action Verbs */}
                {(() => {
                    const isGood = atsAudit.actionVerbStats.percentage >= 70;
                    return (
                        <div style={{
                            padding: '0.55rem 0.75rem',
                            backgroundColor: isGood ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                            textAlign: 'center',
                            transition: 'background-color 0.2s ease'
                        }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                                Action Verbs
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isGood ? 'var(--success)' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                {isGood ? <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={12} style={{ color: '#f59e0b' }} />}
                                <span>{atsAudit.actionVerbStats.percentage}% of Bullets</span>
                            </div>
                        </div>
                    );
                })()}

                {/* 4. Attention Needed */}
                {(() => {
                    const issuesCount = atsAudit.warningCount + atsAudit.failedCount;
                    const isGood = issuesCount === 0;
                    return (
                        <div style={{
                            padding: '0.55rem 0.75rem',
                            backgroundColor: isGood ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                            textAlign: 'center',
                            transition: 'background-color 0.2s ease'
                        }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                                Attention Needed
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isGood ? 'var(--success)' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                {isGood ? <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={12} style={{ color: '#f59e0b' }} />}
                                <span>{issuesCount} Item{issuesCount === 1 ? '' : 's'}</span>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Expandable Detailed ATS Audit Inspector */}
            {isExpanded && (
                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: activeTab === 'all' ? 700 : 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            All Checks ({atsAudit.passedCount}/{atsAudit.totalChecks || 16})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('issues')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: activeTab === 'issues' ? 700 : 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: activeTab === 'issues' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'issues' ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Fix Recommendations ({atsAudit.warningCount + atsAudit.failedCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('keywords')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: activeTab === 'keywords' ? 700 : 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: activeTab === 'keywords' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'keywords' ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Role Keywords & Gap Matrix
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('ai_deep')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: activeTab === 'ai_deep' ? 700 : 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: activeTab === 'ai_deep' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'ai_deep' ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}
                        >
                            <Sparkles size={12} /> AI Recruiter Deep Audit {aiDeepResult && `(${aiDeepResult.match_score}/100)`}
                        </button>
                    </div>

                    {/* TAB 1 & 2: Checks List */}
                    {(activeTab === 'all' || activeTab === 'issues') && (
                        <div>
                            {/* Category progress summary */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '0.75rem',
                                marginBottom: '1.25rem'
                            }}>
                                {atsAudit.categoryBreakdown.map(cat => (
                                    <div
                                        key={cat.category}
                                        style={{
                                            padding: '0.65rem 0.85rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-subtle)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            <span>{cat.category}</span>
                                            <span style={{ fontWeight: 700, color: cat.percentage >= 80 ? 'var(--success)' : (cat.percentage >= 60 ? 'var(--warning)' : 'var(--danger)') }}>
                                                {cat.score}/{cat.maxScore} pts ({cat.percentage}%)
                                            </span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${cat.percentage}%`,
                                                height: '100%',
                                                backgroundColor: cat.percentage >= 80 ? 'var(--success)' : (cat.percentage >= 60 ? 'var(--warning)' : 'var(--danger)'),
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Individual Check Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {atsAudit.checklist
                                    .filter(item => activeTab === 'all' || item.status !== 'passed')
                                    .map(item => {
                                        const isPass = item.status === 'passed';
                                        const isWarn = item.status === 'warning';
                                        return (
                                            <div
                                                key={item.id}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    backgroundColor: isPass ? 'rgba(34, 197, 94, 0.03)' : (isWarn ? 'rgba(234, 179, 8, 0.04)' : 'rgba(239, 68, 68, 0.05)'),
                                                    border: `1px solid ${isPass ? 'rgba(34, 197, 94, 0.2)' : (isWarn ? 'rgba(234, 179, 8, 0.25)' : 'rgba(239, 68, 68, 0.25)')}`,
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.75rem'
                                                }}
                                            >
                                                <div style={{ marginTop: '2px' }}>
                                                    {isPass && <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />}
                                                    {isWarn && <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />}
                                                    {!isPass && !isWarn && <XCircle size={16} style={{ color: 'var(--danger)' }} />}
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {item.title}
                                                            </span>
                                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                                ({item.category})
                                                            </span>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            color: isPass ? 'var(--success)' : (isWarn ? 'var(--warning)' : 'var(--danger)')
                                                        }}>
                                                            +{item.pointsEarned} / {item.maxPoints} pts
                                                        </span>
                                                    </div>

                                                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                        {item.details}
                                                    </p>

                                                    {!isPass && item.fixTip && (
                                                        <div style={{
                                                            fontSize: '0.72rem',
                                                            color: 'var(--primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            marginTop: '0.25rem'
                                                        }}>
                                                            <strong>Recommendation:</strong> {item.fixTip}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Role Keywords & Gap Matrix */}
                    {activeTab === 'keywords' && (
                        <div>
                            <div style={{
                                padding: '0.85rem 1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem',
                                border: '1px solid var(--border-subtle)'
                            }}>
                                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Keyword Alignment for: {selectedRole}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                    ATS systems match incoming resumes against core competencies expected for the job title. Click <strong>+ Add to Skills</strong> on missing keywords to insert them into your resume.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                {/* Matched Skills */}
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(34, 197, 94, 0.04)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--success)' }}>
                                            Matched Core Skills ({atsAudit.matchedSkills.length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {atsAudit.matchedSkills.length > 0 ? (
                                            atsAudit.matchedSkills.map(sk => (
                                                <span
                                                    key={sk}
                                                    style={{
                                                        padding: '0.2rem 0.55rem',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 600,
                                                        backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                                        color: 'var(--success)',
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                                    }}
                                                >
                                                    ✓ {sk}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                No matched core skills detected yet. Add skills to increase match percentage.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Missing Skills */}
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.04)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
                                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--danger)' }}>
                                            Missing High-Priority Keywords ({atsAudit.missingSkills.length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {atsAudit.missingSkills.length > 0 ? (
                                            atsAudit.missingSkills.map(sk => (
                                                <button
                                                    key={sk}
                                                    type="button"
                                                    onClick={() => handleAddMissingSkill(sk)}
                                                    style={{
                                                        padding: '0.2rem 0.55rem',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 600,
                                                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                                        color: '#f87171',
                                                        borderRadius: '4px',
                                                        border: '1px dashed rgba(239, 68, 68, 0.4)',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    title={`Click to insert ${sk} into resume`}
                                                >
                                                    <Plus size={11} /> {sk}
                                                </button>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                                🎉 All expected competencies for {selectedRole} are present!
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Deep AI ATS Audit (FastAPI / Groq) */}
                    {activeTab === 'ai_deep' && (
                        <div>
                            {aiDeepLoading && (
                                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                                    <LoadingSpinner size="md" />
                                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Running Senior Hiring Architect LLM Evaluation on Groq...
                                    </p>
                                </div>
                            )}

                            {aiError && (
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>
                                        <AlertCircle size={16} /> AI Audit Error
                                    </div>
                                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {aiError}
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="xs"
                                        onClick={handleRunDeepAiAudit}
                                        style={{ marginTop: '0.6rem' }}
                                    >
                                        Retry AI Audit
                                    </Button>
                                </div>
                            )}

                            {!aiDeepLoading && !aiDeepResult && !aiError && (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <Sparkles size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        AI Recruiter Deep Audit
                                    </h4>
                                    <p style={{ margin: '0 auto 1rem auto', maxWidth: '420px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        Evaluate your resume with an AI Chief Talent Officer model. Identifies project depth, quantitative evidence, and technical gaps.
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleRunDeepAiAudit}
                                        leftIcon={<Sparkles size={14} />}
                                    >
                                        Run Deep AI Audit
                                    </Button>
                                </div>
                            )}

                            {!aiDeepLoading && aiDeepResult && (
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.85rem 1rem',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '1rem',
                                        border: '1px solid var(--border-subtle)',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem'
                                    }}>
                                        <div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                                AI Match Assessment
                                            </span>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                                                {aiDeepResult.ats_rating || `${aiDeepResult.match_score}/100 Match`}
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="xs"
                                            onClick={handleRunDeepAiAudit}
                                            leftIcon={<RefreshCw size={12} />}
                                        >
                                            Re-run AI Evaluation
                                        </Button>
                                    </div>

                                    {/* Strengths & Missing Skills */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        {/* Key Strengths */}
                                        <div style={{ padding: '0.85rem', backgroundColor: 'rgba(34, 197, 94, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>
                                                Key Strengths Recognized:
                                            </h5>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                {(aiDeepResult.strengths || []).map((st, i) => (
                                                    <li key={i}>{st}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Missing Skills */}
                                        <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>
                                                AI Flagged Gaps:
                                            </h5>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                {(aiDeepResult.missing_skills || []).map((ms, i) => (
                                                    <li key={i}>{ms}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Action Plan */}
                                    {aiDeepResult.recommendations && aiDeepResult.recommendations.length > 0 && (
                                        <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                Actionable Recommendations:
                                            </h5>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                {aiDeepResult.recommendations.map((rec, i) => (
                                                    <li key={i}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
