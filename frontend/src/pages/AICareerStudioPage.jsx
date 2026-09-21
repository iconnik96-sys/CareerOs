import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { aiFastApiService } from '../services/aiFastApiService';
import { downloadCoverLetterPdf } from '../utils/pdfGenerator';
import {
    Sparkles, Wand2, Copy, Check, Download,
    AlertCircle, Activity, Database, Zap, BookmarkCheck,
    MessageSquare, FileText
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const POPULAR_COMPANIES = [
    'Razorpay', 'Swiggy', 'Postman', 'CRED', 'Zomato',
    'PhonePe', 'Groww', 'Zepto', 'Stripe', 'Google', 'Amazon'
];

export const AICareerStudioPage = () => {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('cover_letter'); // 'cover_letter' | 'bullet_enhancer'
    const [backendOnline, setBackendOnline] = useState(null);
    const [knownCompanies, setKnownCompanies] = useState([]);

    // Unified Cover Letter & Outreach Form State
    const [clFullName, setClFullName] = useState(profile?.full_name || 'Aarav Sharma');
    const [clTargetRole, setClTargetRole] = useState(profile?.target_role || 'Java Backend Developer');
    const [clCompany, setClCompany] = useState('Razorpay');
    const [clPurpose, setClPurpose] = useState('Job Application'); // 'Job Application' | 'Referral Request' | 'Job Application Follow-up' | 'Coffee Chat / Career Advice'
    const [clRecipientRole, setClRecipientRole] = useState('Engineering Manager');
    const [clRecipientName, setClRecipientName] = useState('');
    const [clTone, setClTone] = useState('Confident & Technically Grounded');
    const [clSkills, setClSkills] = useState('Java 17, Spring Boot, PostgreSQL, Redis, Kafka, Docker, REST APIs');
    const [clProjects, setClProjects] = useState('Distributed Payment Microservice with Spring Boot and Redis caching, 85% unit test coverage');
    const [clLoading, setClLoading] = useState(false);
    const [clResult, setClResult] = useState(null);
    const [outputFormat, setOutputFormat] = useState('cover_letter'); // 'cover_letter' | 'inmail' | 'connection_note' | 'talking_points'
    const [copiedCl, setCopiedCl] = useState(false);

    // Bullet Enhancer Form State
    const [rawBullet, setRawBullet] = useState('I made a backend system in Spring Boot with PostgreSQL for handling user payments and added Docker.');
    const [bulletRole, setBulletRole] = useState(profile?.target_role || 'Java Backend Developer');
    const [bulletTechs, setBulletTechs] = useState('Spring Boot, PostgreSQL, Docker, Redis');
    const [bulletFocus, setBulletFocus] = useState('Impact & Metrics');
    const [bulletLoading, setBulletLoading] = useState(false);
    const [bulletResult, setBulletResult] = useState(null);
    const [copiedBulletIdx, setCopiedBulletIdx] = useState(null);

    useEffect(() => {
        aiFastApiService.checkHealth().then(res => setBackendOnline(res.isOnline));
        aiFastApiService.getCompaniesKnowledge().then(comps => {
            if (comps && comps.length > 0) {
                setKnownCompanies(comps);
            }
        });
    }, []);

    const handleGenerateCoverLetter = async (e) => {
        e.preventDefault();
        setClLoading(true);
        try {
            const res = await aiFastApiService.generateRagCompanyOutreach({
                full_name: clFullName,
                target_role: clTargetRole,
                company_name: clCompany,
                purpose: clPurpose,
                skills: clSkills.split(',').map(s => s.trim()).filter(Boolean),
                key_projects: clProjects,
                recipient_role: clRecipientRole,
                recipient_name: clRecipientName,
                tone: clTone
            });
            setClResult(res);
            showToast(`Generated application package for ${clCompany}!`, 'success');
        } catch {
            showToast('Failed to generate cover letter & outreach', 'error');
        } finally {
            setClLoading(false);
        }
    };

    const handleEnhanceBullet = async (e) => {
        e.preventDefault();
        if (!rawBullet.trim()) return;
        setBulletLoading(true);
        try {
            const res = await aiFastApiService.enhanceResumeBullet({
                raw_bullet: rawBullet,
                target_role: bulletRole,
                technologies: bulletTechs.split(',').map(s => s.trim()).filter(Boolean),
                focus_area: bulletFocus
            });
            setBulletResult(res);
            showToast('STAR bullet variations generated!', 'success');
        } catch {
            showToast('Failed to enhance bullet', 'error');
        } finally {
            setBulletLoading(false);
        }
    };

    const copyToClipboard = (text, onSuccess) => {
        navigator.clipboard.writeText(text);
        if (onSuccess) onSuccess();
        showToast('Copied to clipboard!', 'success');
    };

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Database size={13} /> RAG Domain-Grounded AI Engine
                        </span>
                        {backendOnline !== null && (
                            <span className={`badge ${backendOnline ? 'badge-success' : 'badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}>
                                <Activity size={11} /> {backendOnline ? 'FastAPI :8000 Live' : 'Offline Mode (Local Fallback)'}
                            </span>
                        )}
                    </div>
                    <h1 className="page-title">AI Career Studio</h1>
                    <p className="page-subtitle">
                        Generate <strong>Company-Grounded Cover Letters & Recruiter Outreach via RAG</strong> and polish resume bullets with the STAR formula.
                    </p>
                </div>
            </div>

            {/* Main Studio Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('cover_letter')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: 'var(--radius-md)',
                        border: activeTab === 'cover_letter' ? '1px solid var(--primary)' : '1px solid transparent',
                        backgroundColor: activeTab === 'cover_letter' ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === 'cover_letter' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Zap size={16} /> ⚡ Cover Letter & Recruiter Outreach Hub
                </button>

                <button
                    onClick={() => setActiveTab('bullet_enhancer')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: 'var(--radius-md)',
                        border: activeTab === 'bullet_enhancer' ? '1px solid var(--primary)' : '1px solid transparent',
                        backgroundColor: activeTab === 'bullet_enhancer' ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === 'bullet_enhancer' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Wand2 size={16} /> ✨ STAR Resume Bullet Polisher
                </button>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: UNIFIED COVER LETTER & RECRUITER OUTREACH HUB */}
            {/* ========================================================================= */}
            {activeTab === 'cover_letter' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 440px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Form Card */}
                    <Card title="Candidate & Outreach Parameters" subtitle="RAG retrieves the target company's real tech stack to ground your pitch.">
                        {/* Company Presets */}
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                                Popular Tech Companies (Pre-Indexed Knowledge):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {POPULAR_COMPANIES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setClCompany(c)}
                                        style={{
                                            fontSize: '0.72rem',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            border: clCompany.toLowerCase() === c.toLowerCase() ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                            backgroundColor: clCompany.toLowerCase() === c.toLowerCase() ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                                            color: clCompany.toLowerCase() === c.toLowerCase() ? '#c084fc' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleGenerateCoverLetter} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={clFullName} onChange={e => setClFullName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Target Role</label>
                                    <input type="text" className="form-input" value={clTargetRole} onChange={e => setClTargetRole(e.target.value)} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Target Company</label>
                                    <input type="text" className="form-input" value={clCompany} onChange={e => setClCompany(e.target.value)} placeholder="e.g. Razorpay / Swiggy / Google" required />
                                </div>
                                <div>
                                    <label className="form-label">Outreach Goal</label>
                                    <select className="form-input" value={clPurpose} onChange={e => setClPurpose(e.target.value)}>
                                        <option value="Job Application">Formal Job Application</option>
                                        <option value="Referral Request">Referral Request (Alumni/Peer)</option>
                                        <option value="Job Application Follow-up">Job Application Follow-Up</option>
                                        <option value="Coffee Chat / Career Advice">Virtual Coffee Chat / Advice</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Recipient Role</label>
                                    <select className="form-input" value={clRecipientRole} onChange={e => setClRecipientRole(e.target.value)}>
                                        <option value="Engineering Manager">Engineering Manager / Lead</option>
                                        <option value="Technical Recruiter">Technical Recruiter</option>
                                        <option value="College Alumni / Software Engineer">College Alumni / Peer</option>
                                        <option value="Hiring Lead">Hiring Lead</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Recipient Name (Optional)</label>
                                    <input type="text" className="form-input" value={clRecipientName} onChange={e => setClRecipientName(e.target.value)} placeholder="e.g. Priya Verma" />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Tone of Pitch</label>
                                <select className="form-input" value={clTone} onChange={e => setClTone(e.target.value)}>
                                    <option value="Confident & Technically Grounded">Confident & Technically Grounded (Recommended)</option>
                                    <option value="Impact-Driven & Metric-Focused">Impact-Driven & Metric-Focused</option>
                                    <option value="Warm & Conversational">Warm & Conversational</option>
                                    <option value="Direct & Minimalist">Direct & Minimalist</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Key Technical Skills (Comma separated)</label>
                                <input type="text" className="form-input" value={clSkills} onChange={e => setClSkills(e.target.value)} />
                            </div>

                            <div>
                                <label className="form-label">Your Experience, Projects & Achievements</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={clProjects}
                                    onChange={e => setClProjects(e.target.value)}
                                    placeholder="e.g. 2+ years building distributed payment microservices with Spring Boot, Redis caching, and PostgreSQL; 85% test coverage."
                                />
                            </div>

                            <Button type="submit" variant="primary" isLoading={clLoading} leftIcon={<Sparkles size={16} />} style={{ width: '100%', marginTop: '0.5rem' }}>
                                ⚡ Synthesize Cover Letter & Outreach Pitch
                            </Button>
                        </form>
                    </Card>

                    {/* Results Display */}
                    <div>
                        {clLoading ? (
                            <Card>
                                <LoadingSpinner message={`Retrieving ${clCompany} engineering intelligence & synthesizing outreach package...`} />
                            </Card>
                        ) : clResult ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Format Switcher & Output Card */}
                                <Card>
                                    {/* Subtabs for Outputs */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('cover_letter')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'cover_letter' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'cover_letter' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                📄 Full Cover Letter
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('inmail')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'inmail' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'inmail' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                💬 InMail / Cold Pitch
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('connection_note')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'connection_note' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'connection_note' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ⚡ LinkedIn Note (&lt;280 chars)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('talking_points')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'talking_points' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'talking_points' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🎯 Talking Points
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    const textToCopy = outputFormat === 'cover_letter'
                                                        ? clResult.cover_letter
                                                        : outputFormat === 'inmail'
                                                            ? clResult.linkedin_inmail
                                                            : outputFormat === 'connection_note'
                                                                ? clResult.short_connection_note
                                                                : clResult.talking_points?.join('\n• ');
                                                    copyToClipboard(textToCopy, () => {
                                                        setCopiedCl(true);
                                                        setTimeout(() => setCopiedCl(false), 2000);
                                                    });
                                                }}
                                                leftIcon={copiedCl ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                            >
                                                {copiedCl ? 'Copied' : 'Copy'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const contentToExport = outputFormat === 'cover_letter'
                                                        ? clResult.cover_letter
                                                        : outputFormat === 'inmail'
                                                            ? `Subject: ${clResult.subject_line}\n\n${clResult.linkedin_inmail}${clResult.short_connection_note ? `\n\n---\nShort LinkedIn Note (<280 chars):\n${clResult.short_connection_note}` : ''}`
                                                            : outputFormat === 'connection_note'
                                                                ? `LinkedIn Connection Note:\n"${clResult.short_connection_note}"\n\nInMail Pitch:\n${clResult.linkedin_inmail}`
                                                                : `Strategic Interview Talking Points for ${clCompany}:\n\n${clResult.talking_points?.map((tp, idx) => `• ${tp}`).join('\n\n')}`;

                                                    downloadCoverLetterPdf(`Cover_Letter_${clCompany}_${clFullName.replace(/\s+/g, '_')}.pdf`, {
                                                        candidateName: clFullName,
                                                        targetRole: clTargetRole,
                                                        targetCompany: clCompany,
                                                        recipient: `${clRecipientRole}${clRecipientName ? ' (' + clRecipientName + ')' : ''}`,
                                                        subject: clResult.subject_line || `${clTargetRole} Application`,
                                                        content: contentToExport,
                                                        type: outputFormat === 'cover_letter' ? 'Cover Letter' : outputFormat === 'inmail' ? 'LinkedIn InMail Pitch' : outputFormat === 'connection_note' ? 'LinkedIn Connection Note' : 'Interview Talking Points'
                                                    });
                                                    showToast(`Downloaded Cover_Letter_${clCompany}.pdf`, 'success');
                                                }}
                                                leftIcon={<Download size={14} />}
                                            >
                                                PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subtab 1: Full Cover Letter */}
                                    {outputFormat === 'cover_letter' && (
                                        <div style={{
                                            padding: '1.25rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)',
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.7,
                                            fontSize: '0.875rem',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {clResult.cover_letter}
                                        </div>
                                    )}

                                    {/* Subtab 2: LinkedIn InMail / Pitch */}
                                    {outputFormat === 'inmail' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Subject Line: <strong style={{ color: 'var(--text-primary)' }}>{clResult.subject_line}</strong>
                                            </div>

                                            <div style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                whiteSpace: 'pre-line',
                                                lineHeight: 1.6,
                                                fontSize: '0.875rem',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {clResult.linkedin_inmail}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtab 3: LinkedIn Connection Note (<280 chars) */}
                                    {outputFormat === 'connection_note' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Quick LinkedIn DM / Connection Request Note:
                                                </span>
                                                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                                    {clResult.short_connection_note?.length || 0} / 280 chars
                                                </span>
                                            </div>

                                            <div style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                fontSize: '0.9rem',
                                                lineHeight: 1.5,
                                                color: 'var(--text-primary)',
                                                fontStyle: 'italic'
                                            }}>
                                                "{clResult.short_connection_note}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtab 4: Talking Points */}
                                    {outputFormat === 'talking_points' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Use these 3 talking points during introductory calls with {clCompany}'s team:
                                            </div>
                                            {clResult.talking_points?.map((tp, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                                    <BookmarkCheck size={16} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                                        {tp}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ) : (
                            <Card style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Database size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Ready for Company-Grounded Applications & Outreach
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                                    Select your target company and outreach goal on the left. Our <strong>RAG Vector Pipeline</strong> retrieves actual engineering architecture and synthesizes a full Cover Letter, InMail pitch, Connection Note, and Talking Points in 1 click.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: STAR RESUME BULLET POLISHER */}
            {/* ========================================================================= */}
            {activeTab === 'bullet_enhancer' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    <Card title="Raw Bullet & Project Input" subtitle="Convert weak drafts into Google XYZ quantified achievements.">
                        <form onSubmit={handleEnhanceBullet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Draft Bullet Point / Raw Experience</label>
                                <textarea className="form-input" rows={4} value={rawBullet} onChange={e => setRawBullet(e.target.value)} placeholder="e.g. Worked on the backend APIs using Spring Boot and Postgres and added Docker container." required />
                            </div>

                            <div>
                                <label className="form-label">Target Engineering Role</label>
                                <input type="text" className="form-input" value={bulletRole} onChange={e => setBulletRole(e.target.value)} />
                            </div>

                            <div>
                                <label className="form-label">Relevant Technologies (Comma separated)</label>
                                <input type="text" className="form-input" value={bulletTechs} onChange={e => setBulletTechs(e.target.value)} />
                            </div>

                            <div>
                                <label className="form-label">Optimization Focus</label>
                                <select className="form-input" value={bulletFocus} onChange={e => setBulletFocus(e.target.value)}>
                                    <option value="Impact & Metrics">Impact & Metrics (Quantified Latency / Scale)</option>
                                    <option value="Technical Depth & Architecture">Technical Depth & Concurrency / Security</option>
                                    <option value="Concise & Recruiter Scannable">Concise & 1-Line Scannable</option>
                                </select>
                            </div>

                            <Button type="submit" variant="primary" isLoading={bulletLoading} leftIcon={<Wand2 size={16} />} style={{ width: '100%', marginTop: '0.5rem' }}>
                                Transform with STAR Formula
                            </Button>
                        </form>
                    </Card>

                    {/* Bullet Results */}
                    <div>
                        {bulletLoading ? (
                            <Card>
                                <LoadingSpinner message="Applying STAR framework and calculating ATS metric multipliers..." />
                            </Card>
                        ) : bulletResult ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <Card style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                                        <AlertCircle size={15} /> RESUME SPECIALIST CRITIQUE
                                    </div>
                                    <p style={{ fontSize: '0.845rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                                        {bulletResult.key_critique}
                                    </p>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                                        💡 <strong>Interview Pro Tip:</strong> {bulletResult.pro_tip}
                                    </div>
                                </Card>

                                {bulletResult.variations.map((v, idx) => (
                                    <Card key={idx} style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Badge variant={idx === 0 ? 'success' : idx === 1 ? 'purple' : 'neutral'}>
                                                    {v.version_title}
                                                </Badge>
                                                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                                    {v.score_improvement}
                                                </span>
                                            </div>

                                            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(v.enhanced_bullet, () => {
                                                setCopiedBulletIdx(idx);
                                                setTimeout(() => setCopiedBulletIdx(null), 2000);
                                            })} leftIcon={copiedBulletIdx === idx ? <Check size={14} className="text-success" /> : <Copy size={14} />}>
                                                {copiedBulletIdx === idx ? 'Copied' : 'Use Bullet'}
                                            </Button>
                                        </div>

                                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                                            • {v.enhanced_bullet}
                                        </p>

                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.775rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Action Verb: </span>
                                                <strong style={{ color: 'var(--primary)' }}>{v.action_verb}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Quantified Impact: </span>
                                                <strong style={{ color: 'var(--success)' }}>{v.quantifiable_metric}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Keywords: </span>
                                                <span>{v.ats_keywords_included.join(', ')}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Wand2 size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Upgrade Draft Bullets to FAANG-Grade STAR Bullets
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto', fontSize: '0.875rem' }}>
                                    Paste any rough bullet point on the left and our Python FastAPI AI engine will rewrite it with active verbs, quantified results, and ATS keyword relevance.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
