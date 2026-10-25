import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Copy,
    Check,
    Download,
    X,
    Briefcase,
    Building2,
    Send,
    BookmarkCheck,
    RotateCcw,
    FileText,
    MessageSquare,
    Zap,
    ExternalLink
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { aiFastApiService } from '../../services/aiFastApiService';
import { downloadCoverLetterPdf } from '../../utils/pdfGenerator';
import { useToast } from '../../contexts/ToastContext';

export const JobCoverLetterModal = ({
    isOpen,
    onClose,
    job,
    userProfile,
    userSkills = [],
    userProjects = []
}) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState('cover_letter'); // 'cover_letter' | 'inmail' | 'connection_note' | 'talking_points'
    const [copiedField, setCopiedField] = useState(null);
    const [tone, setTone] = useState('Professional & Structured');
    const [recipientRole, setRecipientRole] = useState('Hiring Manager');

    const candidateName = userProfile?.full_name || 'Candidate';
    const targetRole = job?.title || 'Software Engineer';
    const companyName = job?.company || 'Company';

    // Auto-generate on first open if no result yet
    useEffect(() => {
        if (isOpen && job && !result && !loading) {
            handleGenerate();
        }
    }, [isOpen, job?.id]);

    const handleGenerate = async (customTone = tone) => {
        if (!job) return;
        setLoading(true);

        const skillsArray = Array.isArray(job.skills) && job.skills.length > 0
            ? job.skills
            : (Array.isArray(userSkills) ? userSkills.slice(0, 8) : ['JavaScript', 'React', 'Node.js']);

        const projectsSummary = Array.isArray(userProjects) && userProjects.length > 0
            ? userProjects.map(p => `${p.title || p.name}: ${p.description || ''}`).slice(0, 2).join('; ')
            : 'Engineered full-stack responsive web applications with scalable backend services.';

        try {
            const data = await aiFastApiService.generateRagCompanyOutreach({
                full_name: candidateName,
                target_role: targetRole,
                company_name: companyName,
                purpose: 'JOB_APPLICATION',
                skills: skillsArray,
                key_projects: projectsSummary,
                recipient_role: recipientRole,
                recipient_name: 'Hiring Team',
                tone: customTone
            });

            setResult(data);
            showToast(`Tailored application package generated for ${companyName}!`, 'success');
        } catch (err) {
            console.error('Failed to generate tailored cover letter:', err);
            showToast('AI service unavailable. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        showToast('Copied to clipboard!', 'success');
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleDownloadPdf = () => {
        if (!result?.cover_letter) return;
        const filename = `${candidateName.replace(/\s+/g, '_')}_Cover_Letter_${companyName.replace(/\s+/g, '_')}`;
        downloadCoverLetterPdf(filename, {
            candidateName,
            targetRole,
            targetCompany: companyName,
            recipient: recipientRole,
            subject: result.subject_line || `Application for ${targetRole} - ${candidateName}`,
            content: result.cover_letter
        });
        showToast('PDF downloaded successfully!', 'success');
    };

    if (!isOpen || !job) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(5, 8, 22, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.15rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
                        }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    Tailored Cover Letter & Pitch
                                </h3>
                                <Badge variant="primary" style={{ fontSize: '0.7rem' }}>
                                    AI-Grounded
                                </Badge>
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                Specifically crafted for <strong>{job.title}</strong> at <strong>{job.company}</strong>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Subheader Controls: Tone & Regenerate */}
                <div style={{
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tone:</span>
                        {[
                            'Professional & Structured',
                            'Confident & Impact-driven',
                            'Enthusiastic & Passionate'
                        ].map(t => (
                            <button
                                key={t}
                                onClick={() => {
                                    setTone(t);
                                    handleGenerate(t);
                                }}
                                disabled={loading}
                                style={{
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: tone === t ? 700 : 500,
                                    backgroundColor: tone === t ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                                    border: `1px solid ${tone === t ? 'var(--primary)' : 'var(--border-color)'}`,
                                    color: tone === t ? 'var(--primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {t.split(' ')[0]}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerate()}
                        isLoading={loading}
                        leftIcon={<RotateCcw size={13} />}
                        style={{ fontSize: '0.785rem' }}
                    >
                        Regenerate
                    </Button>
                </div>

                {/* Tabs Bar */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem 0',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    overflowX: 'auto'
                }}>
                    {[
                        { id: 'cover_letter', label: 'Cover Letter', icon: <FileText size={15} /> },
                        { id: 'inmail', label: 'LinkedIn InMail / DM', icon: <MessageSquare size={15} /> },
                        { id: 'connection_note', label: 'Quick Connect Note', icon: <Zap size={15} />, badge: '<280 chars' },
                        { id: 'talking_points', label: 'Interview Talking Points', icon: <BookmarkCheck size={15} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.6rem 1rem',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                backgroundColor: 'transparent',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    padding: '1.25rem 1.5rem',
                    overflowY: 'auto',
                    minHeight: '320px'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            <LoadingSpinner message={`Generating customized application materials for ${companyName}...`} />
                            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Matching your technical projects and skills to {job.title} requirements
                            </p>
                        </div>
                    ) : result ? (
                        <div>
                            {/* TAB 1: COVER LETTER */}
                            {activeTab === 'cover_letter' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.65rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            Subject: <strong style={{ color: 'var(--text-primary)' }}>{result.subject_line || `Application: ${targetRole} - ${candidateName}`}</strong>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopy(result.cover_letter, 'cl')}
                                                leftIcon={copiedField === 'cl' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                            >
                                                {copiedField === 'cl' ? 'Copied' : 'Copy Text'}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleDownloadPdf}
                                                leftIcon={<Download size={14} />}
                                            >
                                                Download PDF
                                            </Button>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1.25rem 1.5rem',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-color)',
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.65,
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                                    }}>
                                        {result.cover_letter}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: LINKEDIN INMAIL / RECRUITER DM */}
                            {activeTab === 'inmail' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.65rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            Subject: <strong style={{ color: 'var(--text-primary)' }}>{result.subject_line}</strong>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCopy(result.linkedin_inmail, 'inmail')}
                                            leftIcon={copiedField === 'inmail' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                        >
                                            {copiedField === 'inmail' ? 'Copied' : 'Copy Pitch'}
                                        </Button>
                                    </div>

                                    <div style={{
                                        padding: '1.25rem 1.5rem',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-color)',
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.65,
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {result.linkedin_inmail}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: QUICK CONNECT NOTE (<280 chars) */}
                            {activeTab === 'connection_note' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.65rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            Length: <strong style={{ color: (result.short_connection_note?.length || 0) <= 280 ? 'var(--success)' : 'var(--danger)' }}>
                                                {result.short_connection_note?.length || 0} / 280 characters
                                            </strong>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCopy(result.short_connection_note, 'conn')}
                                            leftIcon={copiedField === 'conn' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                        >
                                            {copiedField === 'conn' ? 'Copied' : 'Copy Note'}
                                        </Button>
                                    </div>

                                    <div style={{
                                        padding: '1.25rem 1.5rem',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-color)',
                                        lineHeight: 1.55,
                                        fontSize: '0.95rem',
                                        color: 'var(--text-primary)',
                                        fontStyle: 'italic'
                                    }}>
                                        "{result.short_connection_note}"
                                    </div>

                                    <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: 0 }}>
                                        💡 Ideal for adding a personalized note when connecting with recruiters or hiring managers on LinkedIn.
                                    </p>
                                </div>
                            )}

                            {/* TAB 4: TALKING POINTS */}
                            {activeTab === 'talking_points' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                                        Elevator talking points on why you are well suited for <strong>{job.title}</strong> at <strong>{companyName}</strong>:
                                    </p>
                                    {result.talking_points?.map((tp, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem',
                                                padding: '1rem 1.25rem',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--success)',
                                                flexShrink: 0,
                                                marginTop: 2
                                            }}>
                                                <Check size={13} />
                                            </div>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                                {tp}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            No application package generated yet. Click "Regenerate" above to create one.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                        Target: <strong style={{ color: 'var(--text-primary)' }}>{companyName}</strong> • {job.title}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Button
                            variant="secondary"
                            onClick={() => handleCopy(result?.cover_letter, 'footer_cl')}
                            disabled={!result?.cover_letter}
                            leftIcon={copiedField === 'footer_cl' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        >
                            {copiedField === 'footer_cl' ? 'Copied Cover Letter' : 'Copy Cover Letter'}
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleDownloadPdf}
                            disabled={!result?.cover_letter}
                            leftIcon={<Download size={14} />}
                        >
                            Download PDF
                        </Button>

                        {job.source_url && job.source_url !== '#' && (
                            <Button
                                variant="outline"
                                onClick={() => window.open(job.source_url, '_blank', 'noopener,noreferrer')}
                                rightIcon={<ExternalLink size={14} />}
                            >
                                Apply on Site
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
